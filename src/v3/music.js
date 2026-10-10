// Original melodies, MIDI pitches. No sampled or borrowed game music.
export const TRACKS={
 forest:{name:'새싹의 산책',tempo:245,voice:'triangle',lead:[67,71,74,76,74,71,69,67,64,67,69,71,74,71,69,64],bass:[43,43,48,48,45,45,50,50]},
 desert:{name:'모래의 수수께끼',tempo:285,voice:'triangle',lead:[62,65,69,70,69,65,64,62,57,62,64,65,69,65,64,57],bass:[38,38,41,41,43,43,45,45]},
 library:{name:'책장 사이의 별',tempo:315,voice:'sine',lead:[72,76,79,83,81,79,76,74,71,74,77,81,79,77,74,71],bass:[48,48,45,45,53,53,55,55]},
 ocean:{name:'소수의 물결',tempo:330,voice:'sine',lead:[65,69,72,76,72,69,67,65,62,65,69,72,74,72,69,67],bass:[41,41,46,46,43,43,48,48]},
 clockwork:{name:'시곗바늘의 춤',tempo:185,voice:'triangle',lead:[64,67,71,76,71,67,66,69,73,78,73,69,67,71,74,79],bass:[40,47,40,47,42,49,42,49]},
 sky:{name:'도형의 날개',tempo:220,voice:'triangle',lead:[74,78,81,85,86,85,81,78,76,79,83,86,88,86,83,79],bass:[50,50,55,55,52,52,57,57]}
};
export const frequency=midi=>440*2**((midi-69)/12);
