
import log from './log.js'

import { client as TwitchClient } from "tmi.js"

/**
 * Entry point for creating a new tmi.client to listen for Twitch channel and chat events.
 */

class ChatClient {

    constructor(config, messageHandler) {

        this.config=config;
        this.messageHandler = messageHandler;

        this.disabled = false;
        this.connected = false;
        this.messageTarget = null;

        const opts = {
            options: { debug: config.debug, /*clientId: config.clientId*/ },
            connection: { reconnect: true, secure: true },
            // identity: config.identity,
            channels: [config.channel]
        };

        this.client = new TwitchClient(opts)
            .on('message', (target, context, msg, self) => this.onMessage(target, context, msg, self))
            .on('connected', (addr, port) => this.onConnect(addr, port))
            .on('disconnected', reason => this.onDisconnect(reason));

        this.client.connect();
    }


    /**
     * 
     */
    onMessage(target, context, msg, self) {

        if (self) return;
        if (this.config.debug) log("onMessage", target, context, msg, self);

        const message = msg.trim();
        const isCommand = message.charAt(0) === "!";

        if (!isCommand) this.processMessage(context, message, self);
    }

    /**
     * tmi client connected
     */
    onConnect(addr, port) {
        log(`* Connected to ${addr}:${port}`);
        this.connected = true;
    }


    /**
     * tmi client disconnect, shut down
     */
    onDisconnect(reason) {
        log(`onDisconnect ${reason}`);
        this.connected = false;
    }

    /**
     * Process regular message text from chat, whisper, ...
     */
    processMessage(context, message, self) {
        if (self) return;

        const messageType = context["message-type"];
        if (messageType == "action") return;

        // Handle different message types..
        switch (messageType) {
            case "chat":
                if(this.config.debug) log("processMessage - chat:", message);
                if(this.messageHandler != null && typeof this.messageHandler == "function") {
                    this.messageHandler(message, context);
                }
                break;
            case "whisper":
                log(`processMessage - Someone whispered. Message: ${message}`);
                break;
            default:
                log(`processMessage - Unknown message type: ${messageType}, message: ${message}`);
                break;
        }
    }


    extractEmotes(emotes) {
        /* id       emote
        304575697: ["12-25"]
        304989019: (2) ["0-10", "27-37"]
        */
        let orderedIds = [];
        // build list of all emotes in order of appearance in a message.
        for (let id in emotes) {
            const emote = emotes[id];
            for (let charIndexes in emote) {
                let emoteIndexes = emote[charIndexes];
                if (typeof emoteIndexes == "string") {
                    emoteIndexes = emoteIndexes.split("-");
                    orderedIds.push({id:id, order:emoteIndexes[0]});
                }
            }
        }

        orderedIds.sort((a,b) => a.order - b.order);

        log("orderedIds:", orderedIds);

        return orderedIds;
    }
    
}

export default ChatClient;
