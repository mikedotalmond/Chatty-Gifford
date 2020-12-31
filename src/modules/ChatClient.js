
import log from './log.js'

import { client as TwitchClient } from "tmi.js"

import config from '../config.js'


/**
 * Entry point for creating a new tmi.client to listen for Twitch channel and chat events.
 */

class ChatClient {

    constructor() {

        log("config", config);

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
        if (config.debug) log("onMessage", target, context, msg, self);

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
                if(config.debug) log("processMessage - chat:", message);
                if(this.messageTarget != null && typeof this.messageTarget.onMessage == "function") {
                    this.messageTarget.onMessage(message);
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
}

// export a single instance of ChatClient
export const chatClient = new ChatClient();
