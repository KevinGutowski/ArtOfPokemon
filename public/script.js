const defaultSelectedSets = ['s10a','s10D','s10P','s9a'].map(el=>el.toLowerCase());
var cardSetsCache = [];
var setsToRender = [];

getAndRenderSets().then(()=>{
    // Add click handlers to the checkboxes to toggle the sets to render
    Array.from(document.querySelectorAll('.checkbox_set')).forEach(el=>{
        el.addEventListener('click', ()=>{
            console.log("Clicked")
            let selectedSets = Array.from(document.querySelectorAll('.checkbox_set:checked')).map(el=>el.name)
            requestForNewSets(selectedSets)
        })
    })
})
// getCards();
requestForNewSets(defaultSelectedSets);

// Todo add in click event to checkbox to update setsToRender
//Array.from(document.querySelectorAll('.checkbox_set:checked')).map(el=>el.name)

async function getAndRenderSets() {
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
        .attr('name', d => d.fields['ID'].toLowerCase())
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
        el.checked = defaultSelectedSets.includes(el.name)
    })
}

async function requestForNewSets(requestedSets) {
    // get the selected sets
    // ["s10a","s10d","s10p","s9a"]
    // check if requested sets are in cardSetCache
    let newSetsToGet = [];
    requestedSets.forEach(setId=>{
        var checkIfInSetCache = cardSetsCache.some(cardSet=>cardSet.set["jpn-cards_shorthand"].includes(setId))
        if (!checkIfInSetCache) {
            newSetsToGet.push(setId)
        }
    })

    // if there are new sets to get, request them and add data to the cache
    if (newSetsToGet.length > 0) {
        let newSets = getSetCards(newSetsToGet)

        // maybe set some limit on number of sets in cache here?
        newSets.then(data=>{
            cardSetsCache = cardSetsCache.concat(data)
            updateCardsWithRequestedSets(requestedSets)
        })
    } else {
        updateCardsWithRequestedSets(requestedSets)
    }
}

function updateCardsWithRequestedSets(requestedSets) {
    // pluck sets requested from cardSetCache
    // updateCards
    let setsToRender = []
    cardSetsCache.forEach(cardSet=>{
        if (requestedSets.includes(cardSet.set["jpn-cards_shorthand"])) {
            setsToRender.push(cardSet)
        }
    })
    updateCards(setsToRender)
}

// Todo: update this to take in an array of sets with cards
// {"set":
//        {"jpn-cards_id":Int,
//         "jpn-cards_name":"10th Anniversary",
//         "jpn-cards_shorthand":"s10d", (lowercased)
//          "requested_at":""}, 
//          "cards":[{...},{...},{...},...]}
function updateCards(setCards) {
    const cards = setCards.map(set => set.cards);
    const cardData = [].concat.apply([], cards)

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

    let illustratorLabel = d3.select('#illustrators')
        .selectAll('.illustrator')
        .data(sortedIllustrators)
        .join(
            enter => {
                let label = enter.append('label')
                    .attr('for', d => d.replace(" ", "_"))
                    .attr('class', 'illustrator')
                
                label.append('input')
                    .attr('type', 'checkbox')
                    .attr('name', d => d)
                    .attr('checked', 'true')
                    .attr('id', d => d.replace(" ", "_"))
                label.append('span')
                    .text(d => d)

                return label
            },
            update => {
                let label = update
                label.select('input')
                    .attr('name', d => d)
                    .attr('id', d => d.replace(" ", "_"))

                label.select('span')
                    .text(d => d)
                return label
            },
            exit => exit.remove()
        )

// let illustratorLabel = d3.select('#illustrators')
//     .selectAll('.illustrator')
//     .data(sortedIllustrators)
//     .join('label')
//         .attr('for', d => d.replace(" ", "_"))
//         .attr('class', 'illustrator')
//         .html(d=>{
//             let fmtstr = d.replace(" ","_")
//             return `<input type='checkbox' id='${fmtstr}' name='${d}' checked='true'/> ${d}`
//         })

    let headings = ['Illustrator'].concat(sortedSetNames)

    let heading = d3.select('#tableHeading')
		.selectAll('.heading')
		.data(headings)
            .join('td')
                .attr('class', 'heading')
                .text(d => d)

    let row = d3.select('#tableBody')
		.selectAll('tr')
		.data(sortedIllustrators)
		.join('tr')

    row.join('td').text(d=>d)

    // let setForIllustrator = row.selectAll()
    //     .data((d) => {
	// 		return sortedIds.map(i => d[1].get(i))
	// 	})
    //     .join('td')
    //         .append('div')
    //         .attr('class', 'setForIllustrator')

    // let cardContainer = setForIllustrator
    //     .selectAll('.cardContainer')
    //     .data(d=>{
    //         if (d == undefined) {
    //             return ""
    //         } else {
    //             return d
    //         }
    //     })
    //     .join('a')
    //     .attr('class','cardContainer')
    //     .attr('href', d=>d.cardUrl)

    // cardContainer.append('div')
    //     .attr('class','imgContainer')
    //     .append('img')
    //     .attr('src',d=>d['imageUrl'])
    //     .style('top',d=>{
    //         if (d['cardType'] == 'Pokémon') {
    //             return '-7px'
    //         } else {
    //             return '-11px'
    //         }})
}

// TODO: change get cards to take in an array of set shortnames (lowercased)
// TODO: don't flatten the array of sets and change updateCards to take in an array of sets
async function getSetCards(sets) {
    const endpoint = `/cards/${sets.join(',')}`;
    const response = await fetch(endpoint);
    // response is an array of objects
    // each object has a set and an array of cards
    // {"set":
    //        {"jpn-cards_id":Int,
    //         "jpn-cards_name":"10th Anniversary",
    //         "jpn-cards_shorthand":"s10d", (lowercased)
    //          "requested_at":""}, 
    //          "cards":[{...},{...},{...},...]}
    // Note: jpn-cards_id is lowercased

    const data = await response.json();
    return data;
}