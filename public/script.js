console.log('Client Script');

const defaultSelectedSets = ['s10a','s10D','s10P','s9a'];

getSets();
getCards();

async function getSets() {
    const response = await fetch('/set');
    const json = await response.json();

    let tr = d3.select('#sets')
        .selectAll('.set')
        .data(json)
        .enter()
        .append('tr')
        .attr('class', 'set')

    tr.append('td').append('input')
        .attr('type','checkbox')
        .attr('name', d => d.fields['ID'])
        .attr('class','checkbox_set')

    tr.append('td')
        .append('img')
        .attr('class','setID-image')
        .text(d => d.fields['ID'])
        .attr('src', d => {
            imgArray = d.fields['ID Image']
            if (imgArray) {
                return imgArray[0].thumbnails.small.url
            } else {
                return ""
            }
        })

    let nameCell = tr.append('td')
        .attr('class', 'name')
        
    nameCell.append('div')
        .text(d => d.fields['Name (English)'])
    nameCell.insert('div')
        .text(d => d.fields['Name (JP)'])
        .attr('class', 'jp')

    

    document.querySelectorAll('.checkbox_set').forEach(el=>{
        let uniformSelectedSetIds = defaultSelectedSets.map(i=>i.toLowerCase())
        el.checked = uniformSelectedSetIds.includes(el.name.toLowerCase())
    })
}

let cardSetsCache = []; // maybe set some limit on number of sets here?
let setsToRender = [];

async function requestForNewSets() {
    // get the selected sets
    let requestedSets = document.querySelectorAll('.checkbox_set:checked').map(el=>el.name.toLowerCase())

    // check if requested sets are in cardSetCache
    let newSetsToGet = [];
    requestedSets.forEach(setId=>{
        var checkIfInSetCache = cardSetsCache.some(set=>i.set.jpn-cards_id.includes(setId))
        if (!checkIfInSetCache) {
            newSetsToGet.push(setId)
        }
    })

    // if there are new sets to get, request them and add data to the cache
    if (newSetsToGet.length > 0) {
        let newCards = getCards(newSetsToGet)
        cardSetsCache.concat(newCards)
    }
    
    // pluck sets requested from cardSetCache
    // updateCards
}

function updateCards(cardData) {
    let cardsByIllustrator_set = Array.from(d3.group(cardData, d=>d.illustrator, d=>d.setId)).sort((a,b)=>{
		if (a[0].toLowerCase() < b[0].toLowerCase()) { return -1 }
		if (a[0].toLowerCase() > b[0].toLowerCase()) { return 1 }
		return 0
	}).filter(i=>{
		if (i[0].length > 0) {
			return i
		}
	})

    let sortedIllustrators = cardsByIllustrator_set.map(el=>el[0])
    let idGroups = d3.group(cardData, d=>d.setId)
    let sortedIdGroups = [...idGroups.entries()].sort()
    let sortedIds = sortedIdGroups.map(el=>el[1][0].setId)   
    let sortedSetNames = sortedIdGroups.map(el=>el[1][0].setName)

    let tr = d3.select('#illustrators')
        .selectAll('.illustrator')
        .data(sortedIllustrators)
        .enter()
        .append('tr')
        .attr('class', 'illustrator')

    tr.append('td').append('input')
        .attr('type','checkbox')
        .attr('checked','true')
        .attr('name', d => d)

    tr.append('td')
        .text(d => d)


    let headings = ['Illustrator'].concat(sortedSetNames)

    let heading = d3.select('#tableHeading')
		.selectAll('.heading')
		.data(headings)
		.enter()
		.append('td')
		.attr('class','heading')
		.text(d=>d)

    let row = d3.select('#tableBody')
		.selectAll('tr')
		.data(cardsByIllustrator_set)
		.join('tr')

    row.append('td').text(d=>d[0])

    let setForIllustrator = row.selectAll()
        .data((d) => {
			return sortedIds.map(i => d[1].get(i))
		})
        .join('td')
            .append('div')
            .attr('class', 'setForIllustrator')

    let cardContainer = setForIllustrator
        .selectAll('.cardContainer')
        .data(d=>{
            if (d == undefined) {
                return ""
            } else {
                return d
            }
        })
        .join('a')
        .attr('class','cardContainer')
        .attr('href', d=>d.cardUrl)

    cardContainer.append('div')
        .attr('class','imgContainer')
        .append('img')
        .attr('src',d=>d['imageUrl'])
        .style('top',d=>{
            if (d['cardType'] == 'Pokémon') {
                return '-7px'
            } else {
                return '-11px'
            }})
}

// TODO: change get cards to take in an array of set ids (lowercased)
// TODO: don't flatten the array of sets and change updateCards to take in an array of sets
async function getCards() {
    const endpoint = `/cards/${defaultSelectedSets.join(',')}`;
    const response = await fetch(endpoint);
    // response is an array of objects
    // each object has a set and an array of cards
    // {"set":{"jpn-cards_id":"s10a","jpn-cards_name":"10th Anniversary","requested_at":""}, "cards":[{...},{...},{...},...]}
    // Note: jpn-cards_id is lowercased

    const data = await response.json();
    const cards = data.map(set => set.cards);

    const flattenedCards = [].concat.apply([], cards)
    updateCards(flattenedCards)
}