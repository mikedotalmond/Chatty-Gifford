
const rndInt = n => (Math.random() * n) | 0;
const genRandomId = () => rndInt(0xffffff7).toString(36);
const randomSort = (a, b) => (Math.random() >= 0.5) ? -1 : 1;
const now = () => Date.now();
const filterUnique = (value, index, self) => self.indexOf(value) === index;
const stripUsernames = str => str.replace(/@[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*/gi, "");

export {
    rndInt,
    genRandomId,
    randomSort,
    filterUnique,
    stripUsernames,
    now    
}