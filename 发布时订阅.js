class eve {
    constructor(options){
        this.listeners = {};
    } 

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
            this.listeners[event].push(callback);
        }
    }
    emit(event, data){
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                callback(data);
            });
        }

    }

}
export default new eve();
