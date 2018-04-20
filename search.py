from bisect import bisect_left, bisect_right
import pickle
import nltk
from nltk.corpus import stopwords
from collections import Counter
#from nltk.tokenize import wordpunct_tokenize
#nltk.download('stopwords')

class Search_Engine(object):
    """find keywords from setence and search the icon database"""

    def __init__(self, word_timestamp, gestures, language, iconIndex):
        self._gestures = gestures or []
        self._word_timestamp = word_timestamp or []
        self.language = language
        self.iconIndex = iconIndex
        if language == 'jp':
            with open('japanese.txt','r', encoding='utf-8') as f:
                self.stoplist = set(f.read().splitlines())
        elif language == 'en':
            self.stoplist = set(stopwords.words('english'))           

    def stopper(self,sent):
        #sent is list
        # tokenized_sent = word_tokenize(sent.lower())
        if self.language == 'en':
            sent = [x.lower() for x in sent]
        tokenized_sent_nostop = [token for token in sent if token not in self.stoplist]
        return tokenized_sent_nostop

    def get_keywords(self):
        for gesture in self._gestures:
            print("gesture: "+str(gesture), flush= True)
            gesture_span = [gesture[0]-1, gesture[1]]
            print("gesture_span: "+str(gesture_span), flush= True)
            wts_avg = [(x[1]+x[2])/2 for x in self._word_timestamp]
            print(str(wts_avg), flush= True)
            minIndex = bisect_right(wts_avg, gesture_span[0])
            maxIndex = bisect_left(wts_avg, gesture_span[1])
            print("minIndex is {}, maxIndex is {}".format(minIndex, maxIndex), flush = True)
            keywords = [x[0] for x in self._word_timestamp[minIndex:maxIndex]]
            keywords_token = self.stopper(keywords)
            print(keywords_token, flush=True)
            yield keywords_token #keywords_token can be 
    
    def one_word_query(self, word):
        print(word,flush=True)
        invertedIndex = self.iconIndex
        if word in invertedIndex:
            print("search word is {}".format(word),flush=True)
            print("search result is {}".format(invertedIndex[word]),flush=True)
            return invertedIndex[word]
        else:
            return []
    
    def free_query(self, keywords):
    # print("gestures is "+ str(gestures), flush=True)
        # keywords = ['computer', 'cloud']
        querySet = []
        for k in keywords:
            query = self.one_word_query(k)
            querySet.append(query)
        return querySet

    def rank_query(self, querySet):
        if not querySet:
            return []
        flatlist = [item for sublist in querySet for item in sublist]
        counts = Counter(flatlist)
        countlist = sorted(flatlist, key=counts.get, reverse=True)
        full_rank = list(set(countlist))
        # Only take 5 prior results
        prior_rank = full_rank[:5]
        print("rank list: {}".format(prior_rank), flush = True)
        return prior_rank
    
    def get_icons(self):
        ranks = []
        keys = []
        keywords = self.get_keywords() # generator
        for k in keywords:
            querySet = self.free_query(k)
            rank = self.rank_query(querySet)
            if k:
                keys.append(k)
            else:
                keys.append("?")
            ranks.append(rank)
        return (keys,ranks)
