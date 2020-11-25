import { triggerSearch } from "../cdtnApi";

// TODO add mock here

describe("CDTN search API client", () => {
  it("should only count unique visits", async () => {
    const res = await triggerSearch("code du travail");
    expect(res).toMatchSnapshot();
  });

  // for mocking
  const obj = {
    articles: [
      {
        _score: 11.449638,
        cdtnId: "c48e2d2ce0",
        description:
          "Pour l'application du I de l'article L. 2261-32 du code du travail, le ministre chargé du travail engage en priorité et selon l'un des critères suivants la fusion des branches : 1° Comptant moins de 5 000 salariés ; 2° N'ayant pas négocié au cours des trois  dernières années sur plusieurs thèmes relevant de la négociation  obligatoire mentionnés aux articles L. 2241-1 et suivants, L. 2241-3 et suivants, L. 2241-7 et suivants du code du travail ; 3° Dont le champ d'application géographique est uniquement régional ou local ; 4° Dans lesquelles moins de 5 % des entreprises adhèrent à une organisation professionnelle représentative des employeurs ; 5° Dont la commission paritaire permanente  de négociation et d'interprétation ne s'est pas réunie au cours de  l'année précédente",
        slug: "r2261-15",
        source: "code_du_travail",
        title: "R2261-15",
        url:
          "https://www.legifrance.gouv.fr/affichCodeArticle.do;?idArticle=LEGIARTI000033401698&cidTexte=LEGITEXT000006072050",
      },
      {
        _score: 11.270105,
        cdtnId: "3ae3266bea",
        description:
          "Les manquements aux obligations mentionnées à l'article R. 8115-1 sont ceux résultant de la méconnaissance des dispositions du troisième alinéa du II de l'article L. 1262-4, des articles L. 1262-4-1, L. 1262-4-4, L. 1262-4-5, L. 1263-6 et L. 1263-7 du code du travail",
        slug: "r8115-5",
        source: "code_du_travail",
        title: "R8115-5",
        url:
          "https://www.legifrance.gouv.fr/affichCodeArticle.do;?idArticle=LEGIARTI000042168345&cidTexte=LEGITEXT000006072050",
      },
      {
        _score: 11.225529,
        cdtnId: "45508a77a0",
        description:
          "Le repos compensateur acquis au titre de l'article L. 212-5-1 du code du travail peut être pris par demi-journée, comptant pour quatre heures de repos",
        slug: "d744-3",
        source: "code_du_travail",
        title: "D744-3",
        url:
          "https://www.legifrance.gouv.fr/affichCodeArticle.do;?idArticle=LEGIARTI000018519125&cidTexte=LEGITEXT000006072050",
      },
    ],
    documents: [
      {
        _score: 24.256508,
        algo: "fulltext",
        breadcrumbs: [
          {
            label: "Embauche et contrat de travail",
            slug: "/themes/1-embauche-et-contrat-de-travail",
          },
          {
            label: "Contrat de travail",
            slug: "/themes/12-contrat-de-travail",
          },
        ],
        cdtnId: "f6247840b2",
        description:
          "Le contrat de travail peut être verbal (donc non écrit), sauf lorsque le code du travail prévoit l’obligation d’un contrat de travail écrit et signé. Cette…",
        slug: "est-il-obligatoire-davoir-un-contrat-de-travail-ecrit-et-signe",
        source: "contributions",
        title:
          "Est-il obligatoire d'avoir un contrat de travail écrit et signé ?",
      },
      {
        _score: 1.2442716,
        algo: "semantic",
        breadcrumbs: [
          {
            label: "Représentation du personnel et négociation collective",
            slug:
              "/themes/7-representation-du-personnel-et-negociation-collective",
          },
          {
            label: "Négociations de branche",
            slug: "/themes/74-negociations-de-branche",
          },
        ],
        cdtnId: "6c801df84b",
        description:
          "Le code APE (activité principale exercée) permet d'identifier la branche d'activité principale de l'entreprise ou du travailleur indépendant.",
        slug: "a-quoi-correspond-le-code-ape",
        source: "fiches_service_public",
        title: "À quoi correspond le code APE ?",
        url:
          "https://www.service-public.fr/professionnels-entreprises/vosdroits/F33050",
      },
    ],
    themes: [
      {
        _score: 9.150444,
        algo: "fulltext",
        slug: "312-duree-du-travail-a-temps-complet",
        source: "themes",
        title: "Durée du travail à temps complet",
      },
      {
        _score: 1.154994,
        algo: "semantic",
        breadcrumbs: [
          {
            label: "Conflits au travail et contrôle de la réglementation",
            slug:
              "/themes/9-conflits-au-travail-et-controle-de-la-reglementation",
          },
        ],
        slug: "95-travail-illegal",
        source: "themes",
        title: "Travail illégal",
      },
    ],
  };
});
