const log = (...args) => {
    if (window.chatgifconfig.debug && (typeof (console) !== 'undefined')) {
        console.log(...args);
    }
}
export default log;