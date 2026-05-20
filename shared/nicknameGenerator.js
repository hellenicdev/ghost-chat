const adjectives = [
  'Calm', 'Silent', 'Neon', 'Dark', 'Swift', 'Brave', 'Cool', 'Wild',
  'Sharp', 'Lucky', 'Bold', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind',
  'Lively', 'Mighty', 'Noble', 'Quiet', 'Rapid', 'Shy', 'Sly', 'Sneaky',
  'Stealthy', 'Wise', 'Zealous', 'Bright', 'Cosmic', 'Digital', 'Electric',
  'Frozen', 'Golden', 'Hyper', 'Icy', 'Jade', 'Lunar', 'Magic', 'Neon',
  'Pixel', 'Quantum', 'Royal', 'Solar', 'Turbo', 'Ultra', 'Violet', 'Cyber'
];

const animals = [
  'Wolf', 'Tiger', 'Fox', 'Eagle', 'Bear', 'Owl', 'Panda', 'Lion',
  'Hawk', 'Dolphin', 'Falcon', 'Lynx', 'Raven', 'Shark', 'Cougar',
  'Jaguar', 'Koala', 'Leopard', 'Phoenix', 'Cobra', 'Drake', 'Gecko',
  'Heron', 'Ibex', 'Jackal', 'Kiwi', 'Lizard', 'Mantis', 'Otter',
  'Puma', 'Ram', 'Stag', 'Toad', 'Viper', 'Wasp', 'Yak', 'Zebra',
  'Badger', 'Cheetah', 'Dingo', 'Elk', 'Finch', 'Griffin', 'Hornet'
];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNickname() {
  const adj = randomElement(adjectives);
  const animal = randomElement(animals);
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${animal}${num}`;
}
