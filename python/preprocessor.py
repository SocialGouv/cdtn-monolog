from datasketch import MinHash, MinHashLSH
from nltk import ngrams
import hunspell
import spacy
import re

nlp = spacy.load('fr_core_news_sm')

hobj = hunspell.HunSpell('../French.dic', '../French.aff')

specific_tokens = ['cdd','cdi','rtt','ass','csp','smic', 'annualisation', '-t', 'vélib', 
                   "prud'hommes",'cse', 'burn', 'out', 'vae', 'cpf', 'urssaf', 'dpae', '-ce', '-il', '-on', '13ème', '14ème',
                  'kbis', 'whistleblower', 'btp', 'dif', 'cif', 'chsct', 'pee', 'perco', 'syntec', 'sesu', 'pec']

for t in specific_tokens :
    hobj.add(t) 

standard_issues = [
    ('chomage', 'chômage'),
    ('cddi', 'cdi'),
    ('maitre','maître'),
    ('arret','arrêt'),
    ('direccte','directe'),
    ('blame','blâme'),
    ('delai','délai'),
    ('demission','démission'),
    ('indemnites', 'indemnités'),
    ('modele','modèle'),
    ('licenciment','licenciement'),
    ('harcelement','harcèlement'),
    ('france','France'),
    ('periode','période'),
    ('preavis','préavis'),
    ('securité','sécurité'),
    ('periode','période'),
    ('legislation', 'législation'),
    ('ferie', 'férié')
]

def to_tokens(sugg):
    doc = nlp(sugg)
    tokens = []
    for token in doc:
        if (token.pos_ != 'PUNCT'): 
            tokens.append(token)
    return tokens

def suggestion_filter(sugg):
    for token in to_tokens(sugg):
        if not hobj.spell(token.text):
            print("Error : " + token.text)
            #return token.text        
            return False
    
    if sugg.isdigit():
        return False

    return True

def replace_standard_issues(entities):
    
    def replacement(original):
        tmp = original
        for (s,r) in standard_issues:
            tmp = tmp.replace(s,r)
        if original[:2]  == 'a ':
            tmp = 'à' + original[1:]
        return tmp

    return entities.apply(lambda s : replacement(s))
    
    
def prepro_hash(sugg):
    no_punct = re.sub(r'[^\w\s]', ' ', sugg)
    return " ".join([t.text.strip() for t in to_tokens(no_punct)])

def disambiguate_entities(entities):
    
    lsh = MinHashLSH(threshold=0.85, num_perm=128)

    minhashes = {}
    for c, i in enumerate(entities):
        minhash = MinHash(num_perm=128)
        pi = prepro_hash(i)
        for d in ngrams(pi, 3):
            minhash.update("".join(d).encode('utf-8'))
        lsh.insert(c, minhash)
        minhashes[c] = minhash
    
    sets = []

    unambiguous = []

    def search_candidate(doc):
        minhash = MinHash(num_perm=128)
        pi = prepro_hash(doc)
        for d in ngrams(pi, 3):
            minhash.update("".join(d).encode('utf-8'))

        search = lsh.query(minhash)

        if (len(search) > 1):
            print("Disambiguation match : " + doc)
            print([entities[i] for i in search])
            print()
            sets.append(search)
        else:
            unambiguous.append(doc)
    
    return [search_candidate(x) for x in unambiguous]