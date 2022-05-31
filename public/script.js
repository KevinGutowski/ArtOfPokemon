console.log('Client Script');

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
}

async function getCards() {
    const response = await fetch('/cards');
    const data = await response.json();

    let cardsByIllustrator_set = Array.from(d3.group(data, d=>d.illustrator, d=>d.setId)).sort((a,b)=>{
		if (a[0].toLowerCase() < b[0].toLowerCase()) { return -1 }
		if (a[0].toLowerCase() > b[0].toLowerCase()) { return 1 }
		return 0
	}).filter(i=>{
		if (i[0].length > 0) {
			return i
		}
	})

    let sortedIllustrators = cardsByIllustrator_set.map(el=>el[0])
    let idGroups = d3.group(data, d=>d.setId)
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
            console.log(d)
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