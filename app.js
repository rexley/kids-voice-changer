const phrases = [
  "The purple penguin stole my pancakes!",
  "Warning! A tiny dragon is in the kitchen!",
  "My socks have joined a secret space program.",
  "I am the ruler of the moon cheese kingdom!",
  "The cat knows where the treasure is hidden.",
  "Robots should always eat dessert first.",
  "A dinosaur just rang the doorbell!",
  "Operation: Sneaky Banana is now beginning.",
  "Do not press the gigantic red button!",
  "I have been transformed into a potato!"
];

const presets = [
  { id:'normal', emoji:'🙂', name:'Normal', desc:'Your regular voice', rate:1, echo:0, robot:0, lowpass:18000, highpass:30, distortion:0 },
  { id:'chipmunk', emoji:'🐿️', name:'Chipmunk', desc:'Tiny and super fast', rate:1.48, echo:.03, robot:0, lowpass:18000, highpass:100, distortion:0 },
  { id:'giant', emoji:'🧌', name:'Giant', desc:'Deep and lumbering', rate:.68, echo:.08, robot:.05, lowpass:2500, highpass:35, distortion:.08 },
  { id:'robot', emoji:'🤖', name:'Robot', desc:'Beep-boop machine voice', rate:.98, echo:.05, robot:.88, lowpass:5500, highpass:180, distortion:.22 },
  { id:'alien', emoji:'👽', name:'Alien', desc:'From another galaxy', rate:1.18, echo:.22, robot:.42, lowpass:7500, highpass:220, distortion:.1 },
  { id:'monster', emoji:'👹', name:'Monster', desc:'Growly cave creature', rate:.58, echo:.18, robot:.16, lowpass:1900, highpass:30, distortion:.32 },
  { id:'ghost', emoji:'👻', name:'Ghost', desc:'Spooky and echoey', rate:.86, echo:.62, robot:.08, lowpass:6800, highpass:120, distortion:0 },
  { id:'radio', emoji:'📻', name:'Old Radio', desc:'Crackly walkie-talkie', rate:1, echo:.04, robot:.14, lowpass:3400, highpass:420, distortion:.26 },
  { id:'underwater', emoji:'🌊', name:'Underwater', desc:'Bubbly and muffled', rate:.9, echo:.28, robot:.08, lowpass:1050, highpass:40, distortion:.04 },
  { id:'superhero', emoji:'🦸', name:'Superhero', desc:'Big dramatic voice', rate:.8, echo:.16, robot:.03, lowpass:4300, highpass:50, distortion:.08 },
  { id:'tinybot', emoji:'🛸', name:'Tiny Bot', desc:'Small robot sidekick', rate:1.42, echo:.08, robot:.72, lowpass:8000, highpass:350, distortion:.14 },
  { id:'cave', emoji:'🦇', name:'Echo Cave', desc:'Hello... hello... hello...', rate:1, echo:.72, robot:0, lowpass:10000, highpass:50, distortion:0 }
];

const els = {
  phrase: document.querySelector('#phrase'), newPhraseBtn: document.querySelector('#newPhraseBtn'),
  recordBtn: document.querySelector('#recordBtn'), stopBtn: document.querySelector('#stopBtn'),
  timer: document.querySelector('#timer'), status: document.querySelector('#status'), meter: document.querySelector('.meter-fill'),
  presetGrid: document.querySelector('#presetGrid'), playBtn: document.querySelector('#playBtn'), originalBtn: document.querySelector('#originalBtn'),
  downloadBtn: document.querySelector('#downloadBtn'), clearBtn: document.querySelector('#clearBtn'),
  rateSlider: document.querySelector('#rateSlider'), echoSlider: document.querySelector('#echoSlider'), robotSlider: document.querySelector('#robotSlider'),
  rateValue: document.querySelector('#rateValue'), echoValue: document.querySelector('#echoValue'), robotValue: document.querySelector('#robotValue'),
  phraseChips: document.querySelector('#phraseChips'), helpBtn: document.querySelector('#helpBtn'), helpDialog: document.querySelector('#helpDialog'), closeHelpBtn: document.querySelector('#closeHelpBtn')
};

let audioCtx, mediaRecorder, stream, analyser, meterRAF, timerID;
let chunks = [], audioBuffer = null, currentSource = null, selected = presets[0];
let startedAt = 0;

function randomPhrase() { return phrases[Math.floor(Math.random()*phrases.length)]; }
function setPhrase(text) { els.phrase.textContent = `“${text}”`; }

function renderPresets() {
  els.presetGrid.innerHTML = '';
  presets.forEach((p, index) => {
    const b = document.createElement('button');
    b.className = 'preset' + (index === 0 ? ' active' : '');
    b.innerHTML = `<span class="emoji">${p.emoji}</span><strong>${p.name}</strong><small>${p.desc}</small>`;
    b.addEventListener('click', () => {
      selected = p;
      document.querySelectorAll('.preset').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      els.rateSlider.value = p.rate;
      els.echoSlider.value = p.echo;
      els.robotSlider.value = p.robot;
      syncSliderLabels();
      if (audioBuffer) playChanged();
    });
    els.presetGrid.appendChild(b);
  });
}

function renderPhraseChips() {
  phrases.slice(1,7).forEach(text => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = text;
    b.addEventListener('click', () => setPhrase(text));
    els.phraseChips.appendChild(b);
  });
}

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

async function startRecording() {
  try {
    const ctx = getAudioContext();
    stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}});
    chunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    mediaRecorder = new MediaRecorder(stream, mime ? {mimeType:mime} : undefined);
    mediaRecorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    mediaRecorder.onstop = handleRecordingReady;
    mediaRecorder.start();

    const source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
    animateMeter();

    startedAt = Date.now();
    timerID = setInterval(updateTimer, 200);
    els.recordBtn.disabled = true; els.recordBtn.classList.add('recording');
    els.stopBtn.disabled = false; els.status.textContent = 'Recording… say something silly!';
  } catch (err) {
    els.status.textContent = 'Microphone access was blocked. Allow microphone access in your browser and try again.';
    console.error(err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  stream?.getTracks().forEach(t => t.stop());
  cancelAnimationFrame(meterRAF); clearInterval(timerID); els.meter.style.width = '2%';
  els.recordBtn.disabled = false; els.recordBtn.classList.remove('recording'); els.stopBtn.disabled = true;
}

async function handleRecordingReady() {
  try {
    const blob = new Blob(chunks, {type: mediaRecorder.mimeType || 'audio/webm'});
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
    [els.playBtn, els.originalBtn, els.downloadBtn, els.clearBtn].forEach(b => b.disabled = false);
    els.status.textContent = 'Nice! Now pick a voice below.';
  } catch (e) {
    console.error(e);
    els.status.textContent = 'I recorded something, but this browser could not decode it. Try Chrome, Edge, or Safari.';
  }
}

function updateTimer() {
  const sec = Math.floor((Date.now()-startedAt)/1000);
  els.timer.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
}

function animateMeter() {
  const data = new Uint8Array(analyser.frequencyBinCount);
  const draw = () => {
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a,b)=>a+b,0)/data.length;
    els.meter.style.width = `${Math.max(2, Math.min(100, avg/1.6))}%`;
    meterRAF = requestAnimationFrame(draw);
  }; draw();
}

function makeDistortionCurve(amount=0) {
  const n=44100, curve=new Float32Array(n), k=amount*120;
  for(let i=0;i<n;i++){ const x=i*2/n-1; curve[i]=(3+k)*x*20*(Math.PI/180)/(Math.PI+k*Math.abs(x)); }
  return curve;
}

function currentSettings() {
  return {...selected, rate:+els.rateSlider.value, echo:+els.echoSlider.value, robot:+els.robotSlider.value};
}

function wireEffectGraph(ctx, source, destination, settings) {
  let node = source;
  const high = ctx.createBiquadFilter(); high.type='highpass'; high.frequency.value=settings.highpass || 30; node.connect(high); node=high;
  const low = ctx.createBiquadFilter(); low.type='lowpass'; low.frequency.value=settings.lowpass || 18000; node.connect(low); node=low;

  if (settings.distortion > .001) {
    const shaper=ctx.createWaveShaper(); shaper.curve=makeDistortionCurve(settings.distortion); shaper.oversample='4x'; node.connect(shaper); node=shaper;
  }

  if (settings.robot > .01) {
    const ringGain=ctx.createGain(); ringGain.gain.value=0;
    const osc=ctx.createOscillator(); osc.type='square'; osc.frequency.value=28 + settings.robot*58;
    osc.connect(ringGain.gain); osc.start();
    const ring=ctx.createGain(); ring.gain.value=.8;
    node.connect(ring); ringGain.connect(ring.gain); node=ring;
  }

  const dry = ctx.createGain(); dry.gain.value=1;
  node.connect(dry); dry.connect(destination);

  if (settings.echo > .01) {
    const delay=ctx.createDelay(1.5); delay.delayTime.value=.16 + settings.echo*.42;
    const feedback=ctx.createGain(); feedback.gain.value=Math.min(.72, .18 + settings.echo*.55);
    const wet=ctx.createGain(); wet.gain.value=.18 + settings.echo*.58;
    node.connect(delay); delay.connect(wet); wet.connect(destination); delay.connect(feedback); feedback.connect(delay);
  }
}

function playBuffer(changed=true) {
  if (!audioBuffer) return;
  if (currentSource) { try { currentSource.stop(); } catch {} }
  const ctx=getAudioContext(); const src=ctx.createBufferSource(); src.buffer=audioBuffer;
  const settings = changed ? currentSettings() : {...presets[0], rate:1};
  src.playbackRate.value=settings.rate;
  wireEffectGraph(ctx, src, ctx.destination, settings);
  src.start(); currentSource=src;
  src.onended=()=>{ if(currentSource===src) currentSource=null; };
}

function playChanged(){ playBuffer(true); }

function syncSliderLabels(){
  els.rateValue.textContent = `${(+els.rateSlider.value).toFixed(2)}×`;
  els.echoValue.textContent = `${Math.round(+els.echoSlider.value*100)}%`;
  els.robotValue.textContent = `${Math.round(+els.robotSlider.value*100)}%`;
}

async function renderChangedBuffer() {
  const settings=currentSettings();
  const length=Math.ceil(audioBuffer.length/settings.rate + audioBuffer.sampleRate*2.2);
  const offline=new OfflineAudioContext(audioBuffer.numberOfChannels,length,audioBuffer.sampleRate);
  const src=offline.createBufferSource(); src.buffer=audioBuffer; src.playbackRate.value=settings.rate;
  wireEffectGraph(offline,src,offline.destination,settings); src.start();
  return offline.startRendering();
}

function audioBufferToWav(buffer) {
  const channels=buffer.numberOfChannels, sampleRate=buffer.sampleRate;
  const frames=buffer.length, bytesPerSample=2, blockAlign=channels*bytesPerSample;
  const out=new ArrayBuffer(44+frames*blockAlign), view=new DataView(out);
  const write=(o,s)=>[...s].forEach((c,i)=>view.setUint8(o+i,c.charCodeAt(0)));
  write(0,'RIFF'); view.setUint32(4,36+frames*blockAlign,true); write(8,'WAVE'); write(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels,true); view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*blockAlign,true); view.setUint16(32,blockAlign,true); view.setUint16(34,16,true); write(36,'data'); view.setUint32(40,frames*blockAlign,true);
  const ch=Array.from({length:channels},(_,i)=>buffer.getChannelData(i)); let offset=44;
  for(let i=0;i<frames;i++) for(let c=0;c<channels;c++){ const s=Math.max(-1,Math.min(1,ch[c][i])); view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true); offset+=2; }
  return new Blob([out],{type:'audio/wav'});
}

async function downloadChanged() {
  if(!audioBuffer) return;
  const old=els.downloadBtn.textContent; els.downloadBtn.textContent='⏳ Making WAV…'; els.downloadBtn.disabled=true;
  try {
    const rendered=await renderChangedBuffer(); const blob=audioBufferToWav(rendered); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`voice-lab-${selected.id}.wav`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  } finally { els.downloadBtn.textContent=old; els.downloadBtn.disabled=false; }
}

function clearRecording(){
  audioBuffer=null; chunks=[]; els.timer.textContent='00:00';
  [els.playBtn,els.originalBtn,els.downloadBtn,els.clearBtn].forEach(b=>b.disabled=true);
  els.status.textContent='Ready for another recording!';
}

els.newPhraseBtn.addEventListener('click',()=>setPhrase(randomPhrase()));
els.recordBtn.addEventListener('click',startRecording); els.stopBtn.addEventListener('click',stopRecording);
els.playBtn.addEventListener('click',()=>playBuffer(true)); els.originalBtn.addEventListener('click',()=>playBuffer(false));
els.downloadBtn.addEventListener('click',downloadChanged); els.clearBtn.addEventListener('click',clearRecording);
[els.rateSlider,els.echoSlider,els.robotSlider].forEach(x=>x.addEventListener('input',syncSliderLabels));
els.helpBtn.addEventListener('click',()=>els.helpDialog.showModal()); els.closeHelpBtn.addEventListener('click',()=>els.helpDialog.close());

renderPresets(); renderPhraseChips(); syncSliderLabels(); setPhrase(phrases[0]);

if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
  els.status.textContent='This browser does not support microphone recording. Try a recent version of Chrome, Edge, Firefox, or Safari.';
  els.recordBtn.disabled=true;
}
