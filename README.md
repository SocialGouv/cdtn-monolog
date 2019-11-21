# CDTN Monolog

Require an Elastic Search instance with logs, check https://github.com/SocialGouv/cdtn-elk

Write JSON file containing all searches request in Logstash :

`yarn run write-searches`

Display specific sessions:

- with visit ids :
  `yarn run print-visits -i 62120,43023`

- random n sessions :
  `yarn run print-visits -n 10`

- display only `suggestion|search|all` related logs :
  `yarn run print-visits -n 10 -t suggestion`

Example for display :

```
yarn run print-visits --ids 61637 -t all
yarn run v1.19.1
$ node -r esm src/printer.js --ids 61637 -t all
┌─────────┬─────────┬─────────────────────────┬─────────────────┬───────────────────────────┬──────────────────────────────────────────────┬────────┐
│ (index) │ idVisit │          type           │ timeSpentPretty │          param1           │                    param2                    │ param3 │
├─────────┼─────────┼─────────────────────────┼─────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
│    0    │  61637  │         'home'          │      '34s'      │                           │                                              │        │
│    1    │  61637  │         'visit'         │   '2 min 30s'   │         'outils'          │             'preavis-demission'              │        │
│    2    │  61637  │         'home'          │      '14s'      │                           │                                              │        │
│    3    │  61637  │   'select_suggestion'   │      '0s'       │          'Amia'           │          'amiante sur un chantier'           │   1    │
│    4    │  61637  │ 'suggestion_candidates' │      '1s'       │                           │                                              │        │
│    5    │  61637  │   'result_candidates'   │      '0s'       │                           │                                              │        │
│    6    │  61637  │        'search'         │      '46s'      │                           │          'amiante sur un chantier'           │        │
│    7    │  61637  │     'select_result'     │      '6s'       │ 'fiche-ministere-travail' │        'amiante#Professionnalisation'        │   1    │
│    8    │  61637  │         'visit'         │   '3 min 39s'   │ 'fiche-ministere-travail' │                  'amiante'                   │        │
│    9    │  61637  │        'outlink'        │   '4 min 36s'   │                           │                                              │        │
│   10    │  61637  │        'search'         │      '53s'      │                           │          'amiante sur un chantier'           │        │
│   11    │  61637  │        'outlink'        │   '2 min 52s'   │                           │                                              │        │
│   12    │  61637  │        'search'         │   '1 min 28s'   │                           │          'amiante sur un chantier'           │        │
│   13    │  61637  │        'outlink'        │      '37s'      │                           │                                              │        │
│   14    │  61637  │        'search'         │      '43s'      │                           │          'amiante sur un chantier'           │        │
│   15    │  61637  │        'outlink'        │   '1 min 9s'    │                           │                                              │        │
│   16    │  61637  │        'search'         │      '17s'      │                           │          'amiante sur un chantier'           │        │
│   17    │  61637  │   'result_candidates'   │      '0s'       │                           │                                              │        │
│   18    │  61637  │        'search'         │      '11s'      │                           │          'amiante sur un chantier'           │        │
│   19    │  61637  │ 'suggestion_candidates' │      '11s'      │                           │                                              │        │
│   20    │  61637  │   'select_suggestion'   │      '0s'       │        'Agent de'         │             'agent de contrôle'              │   0    │
│   21    │  61637  │   'result_candidates'   │      '0s'       │                           │                                              │        │
│   22    │  61637  │        'search'         │      '32s'      │                           │             'agent de contrôle'              │        │
│   23    │  61637  │     'select_result'     │      '2s'       │ 'fiche-ministere-travail' │ 'linspection-du-travail#Quelles-sont-les...' │   4    │
│   24    │  61637  │         'visit'         │   '5 min 6s'    │ 'fiche-ministere-travail' │           'linspection-du-travail'           │        │
│   25    │  61637  │        'outlink'        │      '59s'      │                           │                                              │        │
│   26    │  61637  │        'search'         │                 │                           │             'agent de contrôle'              │        │
│   27    │         │                         │                 │                           │                                              │        │
└─────────┴─────────┴─────────────────────────┴─────────────────┴───────────────────────────┴──────────────────────────────────────────────┴────────┘
✨  Done in 0.27s.
```
