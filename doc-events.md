# Documentation Evenements de Tracking

## Objectif du document:
Avoir une documentation technique et fonctionelle des events de tracking implémentés dans le CDTN, ainsi qu'une méthodologie et des bonnes pratiques pour ajouter un évènement afin de garder de la cohérence. 

### Fonctionnement général
Le tracking des events du CDTN se fait grâce à une [librarie javascript](https://developer.matomo.org/api-reference/tracking-api), initialisé dans [le code cdtn](https://github.com/SocialGouv/code-du-travail-numerique/blob/3d0b2df5e1a5f13bd4b993a95b16237aa426261c/packages/code-du-travail-frontend/src/piwik.js)
chaque évènement customisé est envoyé avec un appel à la fonction matopush :
`matopush(["trackEvent", "eventCategory", "eventAction", "eventName", "eventValue"])`

Matomo fusionne les évènements d'une même session à la fin de celle-ci en utilisant un id de visite autogénéré par fingerprinting, cet ID permet de retracer les évènements successifs d'une même visite, qu'on peut retrouver dans la page [visit logs](https://matomo.fabrique.social.gouv.fr/index.php?module=CoreHome&action=index&idSite=4&period=day&date=yesterday#?idSite=4&period=day&date=2021-10-18&segment=&category=General_Visitors&subcategory=Live_VisitorLog).

![](https://i.imgur.com/t8DCWyD.png)



### Visualiser les events dans Matomo:
[Dans la section Behaviour --> Events](https://matomo.fabrique.social.gouv.fr/index.php?module=CoreHome&action=index&idSite=4&period=day&date=yesterday#?idSite=4&period=day&date=yesterday&segment=&category=General_Actions&subcategory=Events_Events) on peut retrouver la liste des évènements categories et les volumes associés sur une période donnée. 


## Liste des events de tracking:

#### tracking générique (automatique sur chaque page)
lors d'une visite sur une page du site, par défaut matomo envoie un évènement de visite, qui contient des informations (le nom de la page et son url). 
### Outils
#### Indemnités de licenciement
`event_category: "outil"`
`event_action: "view_step_Indemnité de licenciement"`
```json=
event_name:
 - start
 - info_générales
 - ancienneté
 - salaires
 - primes
 - indemnités légales
```
#### Indemnités de précarité
`event_category: "outil"`
`event_action: "view_step_Indemnité de précarité"`

```json=
event_name:
- start
- info_cc
- recherche cc events
- infos_générales
- rémunération
- indemnité
```
#### heures pour recherche d'emploi
`event_category: "outil"`
`event_action: "view_step_Heures pour recherche d’emploi"`
```json=
event_name:
- start
- info_cc
- recherche cc events
- rupture
- infos
- results
```

#### Préavis de licenciement
`event_category: "outil"`
`event_action: "view_step_Préavis de licenciement"`

```json=
event_name:
- start
- situation
- recherche cc events
- infos
- results
```

#### Préavis de démission
`event_category: "outil"`
`event_action: "view_step_Préavis de démission"`

```json=
- infos_cc
- recherche cc events
- infos
- results
````

#### Préavis de retraite
`event_category: "outil"`
`event_action: "view_step_Préavis de départ ou de mise à la retraite"`

```json=
- start
- origine
- ccn
- recherche cc events
- infos
- anciennete
- result
```
#### Recherche CC events (ancien)
- CC_SEARCH:
```jsonld=
event_category: "cc_search"
event_action: "/outils/indemnite-precarite" # slug outil
event_name: "uuid : query"
```

 - CC_SELECT:
 ```jsonld=
event_category: "cc_select"
event_action: "/outils/indemnite-precarite" # slug outil
event_name: "uuid : Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils" # nom de la CC selectionnée
```

 - CC_SEARCH_HELP
  ```jsonld=
event_category: "cc_search_help"
event_action: "/outils/indemnite-precarite" # slug outil
event_name: "b8c01ee4-a615-400c-961a-fb676e3691e0" # id session
```
#### Recherche CC events (nouveau)
- START
```jsonld=
event_category: "outil"
event_action: "view_step_Trouver sa convention collective"
event_name:"start"
```


- CC_SEARCH_TYPE_OF_USERS (click_p1 or click_p2)
```jsonld=
event_category: "cc_search_type_of_users"
event_action: "click_p1" or click_p2 #P1: recherche par cc P2: recherche par entreprise
event_name: "Trouver sa convention collective" # name outil
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```

- CC_SEARCH
```jsonld=
event_category: "cc_search"
event_action: "Trouver sa convention collective"
event_name: {"query":"industrie pharmaceutique"} # objet recherche utilisateur
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```

- CC_SELECT_P1
```jsonld=
event_category: "cc_select_p1" # p1 pour parcours 1: recherche par cc 
event_action: "Trouver sa convention collective"
event_name: "idcc44" # numéro de la cc
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```

- ENTERPRISE_SEARCH
```jsonld=
event_category: "enterprise_search"
event_action: "Trouver sa convention collective"
event_name: {"address":"","query":"bnp paribas"} # objet
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```
- ENTERPRISE_SELECT

```jsonld=
event_category: "enterprise_select"
event_action: "Trouver sa convention collective"
event_name: {"label":"JOBTEASER","siren":"508271715"} # objet
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```
- CC_SELECT_P2:

```jsonld=
event_category: "cc_select_p2"
event_action: "Trouver sa convention collective"
event_name: idcc1486 # numéro de cc
event_value: "2b451f0b-a398-420f-91f6-a1a4be6ed796" # id session
```

### Search & suggestions
- Suggestions
    
```jsonld=
event_category: "selectedSuggestion"
event_action: "resto" # user query at the selection time
event_name: "tickets restaurants" # selection option actually clicked
```
```jsonld=
event_category: "candidateSuggestions"
event_action: "tickets restaurants###tickets resto###ticket restaurant###titre restaurant###jours fériés travaillés restauratio" # list of options ### delimited at the selection time
```

- Search
```jsonld=
event_category: "candidateResults" # deprecated? 
event_action: "tickets restaurants" # actual query passed in search
```

```jsonld=
search: "tickets restaurants" # default matomo search events
```
```jsonld=
event_category: "nextResultPage" # click sur "plus de résultats"
event_action: "tickets restaurants" # actual query passed in  original search
```
```jsonld=
event_category: "selectResult" # click sur un résultat
event_action: {"algo":"pre-qualified","url":"/code-du-travail/r3262-7"}  # algo: result source, url: result destination. 
```
### Pages CC
- pagecc_clickcontrib
```jsonld=
event_category: "pagecc_clickcontrib" # au moment d'un click pour dérouler une  sous-section
event_action: "Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils" # nom de la CC
event_name: "quelles-sont-les-conditions-dindemnisation-pendant-le-conge-de-maternite" # slug de la sous-section
```
- pagecc_clicktheme:
```jsonld=
event_category: "pagecc_clicktheme" # au moment d'un click pour dérouler une sous-section des "Articles de la convention collective"
event_action: "Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils" # nom de la CC
event_name: "raa-45" # ??
```
- default outlink when click on articles
- pagecc_searchcc
```jsonld=
event_category: "pagecc_searchcc" # au moment d'une recherche dans la barre "Recherche dans la convention collective"
event_action: "Bureaux d'études techniques, cabinets d'ingénieurs-conseils et sociétés de conseils" # nom de la CC
event_name: "congés payés" # recherches entrée par l'utilisateur
```
### Contributions
Seulement les évènements par défaut

### Content Page Events:
- Contact
```jsonld=
event_category: "contact" # click sur un résultat
event_action: "click_contact_sr_modale"
event_name: "/recherche?q=tickets+restaurants" # url source
```
- Feedback
```jsonld=
event_category: "feedback" # au moment du click sur oui/non
event_action: "negative" # feedback value (positive or negative)
event_name: "/fiche-ministere-travail/la-remuneration-du-salarie-en-contrat-a-duree-determinee" # url source
```

```jsonld=
event_category: "feedback_suggestion" # déclenché au moment du click sur "envoyer"
event_action: "Je préfère plus de rémunération" # suggestion de l'utilisateur
event_name: "/fiche-ministere-travail/la-remuneration-du-salarie-en-contrat-a-duree-determinee" # url source
```
```jsonld=
event_category: "feedback_category" # déclenché au moment du click sur "envoyer"
event_action: "Je ne suis pas satisfait de cette réglementation." # catégorie sélectionnée par l'utilisateur
event_name: "/fiche-ministere-travail/la-remuneration-du-salarie-en-contrat-a-duree-determinee" # url source
```
- Contenu lié (recommendations)

```jsonld=
event_category: "selectRelated" # déclenché au moment du click sur l'article
event_action: {"reco":"search","selection":"fiche-ministere-travail/le-contrat-a-duree-determinee-cdd#Dans-quels-cas-le-contrat-a-duree-determinee-peut-il-etre-requalifie-en-nbsp"} # reco: type d'algo utilisé pour la reco, selection: contenu de destination
```
- Partages:

```jsonld=
event_category: "clic_share" # déclenché au moment du click sur l'icon
event_action: "https://code.travail.gouv.fr/fiche-ministere" # url sourceselection: contenu de destination
event_name: "facebook" # type d'icon selectionné
```
- glossaire_clicktooltip
```jsonld=
event_category: "glossaire_clicktooltip" # déclenché au moment du click sur l'info-bulle "convention-collective"
event_action: "convention collective" ou "collective agreement" # ?? 
event_name: "/contribution/1501-dans-le-cadre-dun-cdd-quel-est-le-montant-de-lindemnite-de-fin-" # url source
```

## Ajouter un nouvel event
**Note: il n'est pas nécessaire de tracker la page sur laquelle l'evenement est déclenché**

L'ajout d'un nouvel event dépend de son objectif, il doit suivre de préférence le schéma des events déjà implementé à savoir:
 - `event_category`: permet de regrouper les évènements que l'on souhaite voir ensemble exemple:

```json=
event_category: "feedback",
event_name:"positive" ou "negative"
```
ou 
```json=
event_category: "nom d'un outil",
event_name:"étape de l'outil"
```

**Note: ce champ est obligatoire**
- `event_action`: permet de détailler l'action qui déclenche l'évènement
**Note: ce champ est optionel**
Les event de volume, 
- `event_name`: un nom ou une valeur propre à un évènement
exemple:
```json=
event_category: "nom d'un outil",
event_action: "select_ancienneté",
event_name: "12 années"
````
**Note: ce champ est optionel**

- `event_value` même utilisation que `event name`

**Note: il est possible de tracker plusieurs informations dans un même event en utilisant un objet:** `{"info1":12, "info2": "cdd"}`
## Tester les events envoyés via un browser
### Chrome
- S'assurer de ne pas avoir d'extension adblocker (page de navigation privée)
- right click --> inspect 
- onglet network
- filtrer les events par nom "matomo"
- ![](https://i.imgur.com/oxKo6pC.png)
chaque ligne correspond à un évènement  selectionner l'event qu'on veut inspecter, et descendre à la section **Query String Parameters**
- `e_c` correspond à event_category
- `e_a`  correspond à event_action
- `e_n` correspond à event_name
- `e_v` correspond à event_value
![](https://i.imgur.com/9L7ICSt.png)

### :warning: Il est préférable d'éviter les changements non rétro-compatibles les évènements déclenchés permettent d'alimenter les Dashboards Kibana via [Monolog](https://github.com/SocialGouv/cdtn-monolog)
