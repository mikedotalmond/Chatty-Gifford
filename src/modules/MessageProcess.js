import afinn from 'afinn-165';
import nlp from 'compromise';

import { filterUnique, stripUsernames } from './Utils';

class MessageProcess {

    constructor() {
        this.afinnKeys = Object.keys(afinn);
    }

    /**
     * 
     * @param {String} message 
     * @returns 
     */
    parse(/** @type {String} */ message, /** @type {Array<String>} */ ignore) {

        message = message.trim().toLowerCase();
        message = stripUsernames(message);

        let doc = nlp(message);

        doc.normalize();
        doc.parentheses().remove();
        doc.remove('(#Emoticon|#Emoji)');

        const ignoreFilter = (value) => ignore.every(test => value.indexOf(test) == -1);

        const words = doc.text('reduced').split(" ")
            .filter(filterUnique)
            .filter(ignoreFilter);

        doc = nlp(words.join(" "));

        const topics = doc.topics().out('array').filter(filterUnique),
            verbs = doc.verbs().out('array').filter(filterUnique),
            nouns = doc.nouns().out('array').filter(filterUnique),
            sentiments = this.match(words),
            sentimentScore = this.score(words);

        return {
            words: words,
            topics: topics,
            verbs: verbs,
            nouns: nouns,
            sentiments: sentiments,
            sentimentScore: sentimentScore,
            salient: [...sentiments, ...topics, ...verbs, ...nouns].join(' ').split(' ').filter(filterUnique),
        };
    }


    match(/** @type {Array<String>} */ words) {
        const out = [];
        this.afinnKeys.forEach((key) => {
            if (words.indexOf(key) > -1) {
                out.push(key);
            }
        });
        return out;
    }


    /**
     * assign a simple sentiment score to a list of words
     * @param {*} words 
     */
    score(/** @type {Array<String>} */ words) {
        const score = { positive: 0, negative: 0 };

        this.afinnKeys.forEach((key) => {
            if (words.indexOf(key) > -1) {
                let value = afinn[key];
                if (value > 0) score.positive += value;
                else if (value < 0) score.negative += value;
            }
        });

        score.populated = score.positive != 0 || score.negative != 0;
        score.conflicted = score.positive != 0 && score.negative != 0;

        return score;
    }
}

export default MessageProcess;