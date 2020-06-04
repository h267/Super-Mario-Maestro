const KEY_A4 = 69;
const KEY_C4 = 60;
const KEY_F3 = 53;

const SAMPLE_RATE = 44100;
const MASTER_VOLUME = 0.15;

const RELEASE_POS = Math.round((12000 / 44100) * SAMPLE_RATE);
const LONG_RELEASE_POS = Math.round((45500 / 44100) * SAMPLE_RATE);
const RELEASE_DURATION = Math.round((6000 / 44100) * SAMPLE_RATE);

const PPQ = 2520;

const LOAD_DELAY = 0.5;

const LOAD_SIZE = 0.5;

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

let audioCtx = new window.AudioContext();
