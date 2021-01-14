
import afinn from 'afinn-165';
import nlp from 'compromise'

import {filterUnique, stripUsernames, randomSort} from './Utils';

class SentimentScores {

    constructor() {
        this.afinnKeys = Object.keys(afinn);
    }

    processMessage(message) {

        message = message.toLowerCase();
        message = stripUsernames(message);

        let doc = nlp(message);
        doc.normalize();
        doc.parentheses().remove();
        doc.remove('(#Emoticon|#Emoji)');

        let text = doc.text('reduced');
        let words = text.split(" ").filter(filterUnique);

        if (words.length > 6) {
            // lots of words? try to just pick some salient details so that the search passed to the giphy api is a bit more focussed.
            doc = nlp(words.join(" "));
            const topics = doc.topics().out('array');
            const verbs = doc.verbs().out('array');
            const nouns = doc.nouns().out('array');
            const sentiments = this.match(words);
            words = sentiments.concat(topics, nouns, verbs).filter(filterUnique);
            if (words.length > 6) {
                words.sort(randomSort); // shuffle for a bit of variety
                words.length = 6; // then truncate
            }

            text = words.join(" ");
        }

        const score = this.score(words);
        return { text, score };
    }


    match(words) {
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
    score(words) {
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

export default SentimentScores;