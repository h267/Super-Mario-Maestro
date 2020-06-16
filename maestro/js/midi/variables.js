let currentInstrument = new Array(16).fill(0);
let ppos = 0;
let tpos = 0;
let runningStatus = null;
let trackDuration = 0;
let noteDelta = Array(16).fill(0);
let isNewTrack = true;
let currentLabel = 'Goomba';

// Thank you to the person who already did this for me
const midiInstrumentNames = ['Acoustic Grand Piano', 'Bright Acoustic Piano',
	'Electric Grand Piano', 'Honky-tonk Piano',
	'Electric Piano I', 'Electric Piano II', 'Harpsichord',
	'Clavinet', 'Celesta', 'Glockenspiel', 'Music Box',
	'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells',
	'Dulcimer', 'Drawbar Organ', 'Percussive Organ',
	'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion',
	'Harmonica', 'Tango Accordion', 'Acoustic Guitar (nylon)',
	'Acoustic Guitar (steel)', 'Electric Guitar (jazz)',
	'Electric Guitar (clean)', 'Electric Guitar (muted)',
	'Overdriven Guitar', 'Distortion Guitar',
	'Guitar Harmonics', 'Acoustic Bass',
	'Electric Bass (finger)', 'Electric Bass (pick)',
	'Fretless Bass', 'Slap Bass I', 'Slap Bass II',
	'Synth Bass I', 'Synth Bass II', 'Violin', 'Viola', 'Cello',
	'Contrabass', 'Tremolo Strings', 'Pizzicato Strings',
	'Orchestral Harp', 'Timpani', 'String Ensemble I',
	'String Ensemble II', 'Synth Strings I', 'Synth Strings II',
	'Choir Aahs', 'Voice Oohs', 'Synth Choir', 'Orchestra Hit',
	'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet',
	'French Horn', 'Brass Section', 'Synth Brass I',
	'Synth Brass II', 'Soprano Sax', 'Alto Sax', 'Tenor Sax',
	'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon',
	'Clarinet', 'Piccolo', 'Flute', 'Recorder', 'Pan Flute',
	'Blown bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
	'Lead I (square)', 'Lead II (sawtooth)',
	'Lead III (calliope)', 'Lead IV (chiff)', 'Lead V (charang)',
	'Lead VI (voice)', 'Lead VII (fifths)',
	'Lead VIII (bass + lead)', 'Pad I (new age)', 'Pad II (warm)',
	'Pad III (polysynth)', 'Pad IV (choir)', 'Pad V (bowed)',
	'Pad VI (metallic)', 'Pad VII (halo)', 'Pad VIII (sweep)',
	'FX I (rain)', 'FX II (soundtrack)', 'FX III (crystal)',
	'FX IV (atmosphere)', 'FX V (brightness)', 'FX VI (goblins)',
	'FX VII (echoes)', 'FX VIII (sci-fi)', 'Sitar', 'Banjo',
	'Shamisen', 'Koto', 'Kalimba', 'Bagpipe', 'Fiddle',
	'Shanai', 'Tinkle Bell', 'Agogo', 'Steel Drums',
	'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum',
	'Reverse Cymbal', 'Guitar Fret Noise', 'Breath Noise',
	'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter',
	'Applause', 'Gunshot'];
