# Trouver la juridiction {#court-finder}

Tapez une adresse, ou cliquez sur un point de la carte, et voyez quelles juridictions y sont
territorialement compétentes : la justice de paix du canton, et le tribunal de police, le
tribunal de première instance, le tribunal de l'entreprise, le tribunal du travail, la cour
d'appel, la cour du travail et la cour d'assises dont le ressort contient le point. Cela tourne
sur ce package, dans votre navigateur, et montre les appels derrière chaque résultat.

<CourtFinder />

La carte teinte chaque canton d'une de six couleurs, jamais la même qu'un voisin. Zoomez sur une
ville scindée et les contours des bâtiments et les numéros de maison se posent sur la teinte, si
bien que le canton de chaque maison se voit. Survolez pour le canton et sa justice de paix. Le lien
d'un résultat contient l'adresse (`?q=…`) ou le point (`?at=lat,lon`), pour le partager.

## Comment ça marche {#how-it-works}

Trois étapes, une fonction chacune. Seule la première a besoin de quelque chose que le package
n'a pas.

### 1. De l'adresse au point {#_1-address-to-point}

Le package n'est pas un géocodeur. Chaque région tient son propre registre d'adresses, avec une
API qui répond depuis le navigateur : l'Adressenregister (Digitaal Vlaanderen) en Flandre, UrbIS
(paradigm.brussels) à Bruxelles, ICAR (SPW) en Wallonie. Le code postal de l'adresse dit quel
registre interroger ; `getMunicipalitiesForPostalCode` donne la région :

```ts
import { getMunicipalitiesForPostalCode } from 'belgica'

const postalCode = address.match(/\b\d{4}\b/g)?.at(-1) // les quatre derniers chiffres : pas un numéro
const region = postalCode && getMunicipalitiesForPostalCode(postalCode)[0]?.region
// '02000' Flandre, '03000' Wallonie, '04000' Bruxelles : quel registre interroger
```

Pour une adresse que le registre connaît jusqu'au numéro, le point est sur le bâtiment, si bien
que les côtés pair et impair d'une rue limite tombent dans le bon canton. S'il ne connaît que la
rue, le point est quelque part dans la rue, et l'outil le dit.

### 2. Du point au canton {#_2-point-to-canton}

`findCantonsAt` de `belgica/canton-boundaries` confronte le point à la limite IGN de chaque
canton : un canton pour un point en Belgique, deux pour un point sur la ligne entre eux, aucun
hors de Belgique.

```ts
import { findCantonsAt } from 'belgica/canton-boundaries'

findCantonsAt(4.4203, 51.2287).map((c) => c.id) // ['antwerpen-4'] : la longitude d'abord
```

Les limites font 23 Mo de JSON, si bien que cette page ne charge pas ce module. Elle récupère un
fichier par canton, écrit depuis `data/canton-boundaries.json` à la construction du site, et
seulement les cantons dont le rectangle englobant contient le point : quelques centaines de
kilooctets. Le test lui-même est celui du package, le lancer de rayon qu'utilise `findCantonsAt`
(`src/geometry.ts`), donc la réponse est la même. Sur un serveur, appelez `findCantonsAt`, c'est
tout.

À moins de 25 m d'un autre canton, l'outil avertit et montre le texte de la loi pour les deux :
l'IGN a tracé la limite d'après l'annexe au Code judiciaire, et pour une maison sur la ligne
[le texte tranche](/fr/data/canton-boundaries#why-it-s-useful).

### 3. Du canton aux juridictions {#_3-canton-to-courts}

`getCourtsForCanton` donne la justice de paix du canton et, de chaque autre type, la juridiction
dont le ressort contient le canton :

```ts
import { formatCourtName, getContact, getCourtsForCanton } from 'belgica'

for (const court of getCourtsForCanton('antwerpen-4')) {
    formatCourtName(court, 'nl') // 'Vredegerecht Antwerpen 4', 'Politierechtbank Antwerpen', …
    court.address // où déposer
    getContact(court, 'email') // l'e-mail du greffe
}
```

Quelle division d'un tribunal connaît de l'affaire est fixé par arrêté royal et n'est pas encore
dans les données ([#58](https://github.com/pieterjanscheir/belgica/issues/58)) : `getDivisions`
les liste.

## La carte {#the-map}

La carte est [MapLibre GL](https://maplibre.org) sur les tuiles vectorielles
d'[OpenFreeMap](https://openfreemap.org) (données OpenStreetMap), avec les cantons comme source
GeoJSON par-dessus. N'importe quelle bibliothèque cartographique prend les limites telles
quelles :

```ts
import { appliesOn, toDay } from 'belgica'
import { cantonBoundaries } from 'belgica/canton-boundaries'

const today = toDay(new Date())

map.addSource('cantons', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: cantonBoundaries
            .filter((b) => appliesOn(b, today)) // les versions en vigueur aujourd’hui
            .map((b) => ({ type: 'Feature', id: b.canton, properties: {}, geometry: b.geometry })),
    },
})
```

Ce que cette page fait en plus, et qu'une application peut reprendre :

- **Une vue d'ensemble et le détail.** La construction simplifie chaque limite à environ 50 m
  pour un fichier d'ensemble, dessiné en vue éloignée. À partir du zoom 11,5, la carte récupère
  les cantons visibles en pleine précision, si bien qu'une maison d'une rue limite est du bon côté.
- **Six couleurs.** Des cantons voisins ne partagent jamais une couleur : la construction trouve
  les voisins (cantons ayant un point de limite commun) et colore d'abord les plus connectés.
- **Bâtiments et numéros sur la teinte.** Les tuiles vectorielles contiennent les contours des
  bâtiments et les numéros de maison ; dessinés au-dessus du remplissage des cantons, chaque
  maison montre dans quel canton elle se trouve.
- **Les justices de paix.** `belgica/court-locations` a le point de l'IGN pour la plupart
  d'entre elles, dessiné en points à partir du zoom 9.

Le script de construction est [`scripts/build-docs-map.ts`](https://github.com/pieterjanscheir/belgica/blob/main/scripts/build-docs-map.ts),
la carte [`CantonMap.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CantonMap.vue)
et l'outil [`CourtFinder.vue`](https://github.com/pieterjanscheir/belgica/blob/main/docs/.vitepress/components/CourtFinder.vue).

## Construit sur le package {#built-on-the-package}

- [**CourtMap**](https://courtmap.scheir.eu/) va plus loin : la même carte jusqu'à la
  maison, les divisions qui desservent l'adresse, itinéraires et heures d'ouverture, délais et
  intérêts, en quatre langues, avec un serveur MCP et une API REST. Son code est sur
  [GitHub](https://github.com/pieterjanscheir/courtfull).
- L'[explorateur](https://belgica.scheir.eu/) a une page pour chaque juridiction, canton, commune
  et code postal, en 13 langues.

::: warning Données de référence, pas un avis juridique
Les ressorts sont ceux de la loi, les limites la lecture qu'en fait l'IGN, les adresses celles des
registres des régions. Vérifiez les sources officielles avant de vous fier à un résultat là où cela
compte.
:::
