# Exploration de données

### Pré-requis

Afin de pouvoir lancer un notebook, il est nécessaire d'avoir installé sur sa machine :

- [Python 3.9](https://www.python.org/downloads/)
- [Virtualenv](https://virtualenv.pypa.io/en/latest/)

### Installation
Note: vérifiez que vous avez bien la variable `ELASTICSEARCH_API_KEY` définit dans le fichier `.env`

Pour créer l'environnement il suffit, depuis le répertoire explorations :
``` bash
virtualenv venv --python 3.9
```

Une fois l'environnement ``venv`` créé, pour démarrer celui-ci il suffit d'entrer la commande :
``` bash
source venv/bin/activate
```

Installation des dépendances et du package ``cdtn-exploration`` :
``` bash
pip3 install -e .
```

### Notebooks

Démarrer Jupyter Lab en lançant la commande :
``` bash
jupyter notebook
```

Si vous souhaitez créer un nouveau notebook, il vous suffit de dupliquer le ``0_A_DUPLIQUER_POUR_EXPLO.ipynb``.
