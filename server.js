const express = require('express')
const fetch = require('node-fetch')
const app = express()
require('dotenv').config()

app.listen(3000, () => console.log('Running on port 3000'))
app.use(express.static('public'))
app.use(express.json({limit: '1mb'}))

var Airtable = require('airtable');
const { response } = require('express')
let apiKey = process.env.AIRTABLE_API_KEY
let baseID = process.env.AIRTABLE_BASE_ID
var base = new Airtable({apiKey: apiKey}).base(baseID);

app.get('/set', async (req, res) => {
    base('Sets').select({
        view: 'Grid view',
        filterByFormula: `AND(
            {Region} = 'Japanese',
            {Era} = 'Sword & Shield'
            )`
    }).firstPage(function(err, records) {
        if (err) { console.error(err); return; }
        res.json(records);
        // records.forEach(record => {
        //     console.log('Retrieved', record.get('Name (English)'));
        // });
    });
})

app.get('/cards', async (req, res) => {
    const checkedSets = ['s10a','s10D','s10P','s9a','S9','s8b','s8a','s8a-P','s8','s7r','s7d','s6a'];
    const sets_URL = "https://www.jpn-cards.com/set"
    const fetch_response = await fetch(sets_URL)
    const sets_json = await fetch_response.json()
    const sets = sets_json.filter(set => checkedSets.includes(set.shorthand))

    let cards = []
    for await (const set of sets) {
        const cards_URL = `https://www.jpn-cards.com/card/set_id=${set.id}`
        const fetch_response = await fetch(cards_URL)
        const cards_json = await fetch_response.json()
        cards = cards.concat(cards_json)
    }
    res.json(cards)
})