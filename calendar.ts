// Kräver att dessa 2 paket är installerade (via typ browserify? vet inte hur man gör med node på webben):
//
// csv2json: https://www.npmjs.com/package/csvjson-csv2json
//
// ical-generator: https://www.npmjs.com/package/ical-generator
// vilken även inkluderar dokumentation via https://sebbo2002.github.io/ical-generator/develop/reference/

import ical, { ICalCalendar } from 'ical-generator'
const csv2json = require('csvjson-csv2json')

// temp för node.js
import * as fs from 'fs'
import http from 'http'

interface TAEvent {
    "kurs": string,
    "datum": string,
    "dag": string,
    "kl": string,
    "typ": string,
    "grupp": string,
    "rum": string,
    "handledare": string
}

function getText() {
    // templösning för node, behöver ändras för användning i webbläsare
    return fs.readFileSync('./events-new.txt', 'utf8')
}

function getSearchString() {
    // templösning för node
    const args = process.argv.slice(2)
    return args.length == 0 ? "[\\s\\S]*" : args.join(" ")
}

// regexen kan behöva modifieras på webbläsare / andra operativsystem, windows inkluderar \r vid radbrytningar men tror inget annat gör så 
const formattedCSV = getText().replace(/(-{2,}\r\n)| /g, "").replace(/\|/g, ";")
const allEvents: TAEvent[] = csv2json(formattedCSV)

const filterStrings = getSearchString()
const calendar = ical({ name: `Tillfällen ${filterStrings.replace(/ /g, " && ")}` })
const filteredEvents = allEvents.filter(event => filterStrings
    .split(" ")
    .every(str => RegExp(str, "gi")
        .test(Object.values(event).join(" "))
    )
)

filteredEvents.forEach(event => {
    const date = new Date(`${event.datum} ${event.kl}`)
    calendar.createEvent({
        summary: `${event.typ} ${event.kurs}`,
        start: date,
        end: new Date(date.getTime() + 6_300_000), //1h45min senare
        location: event.rum,
        description: `Grupp: ${event.grupp}
Handledare: ${event.handledare}
Sigrid: http://bjornix.cs.lth.se:8091/sigrid
SAM: https://sam.cs.lth.se/`
        // fler attribut?
    })
})

// mer temp
console.log(`Created calendar for ${filterStrings} with ${calendar.events().length} events`)
upload(calendar)

function upload(calendar: ICalCalendar) {
    http.createServer((req, res) => calendar.serve(res, `${filterStrings}.ics`))
        .listen(3000, '127.0.0.1', () => {
            console.log('Server running at http://127.0.0.1:3000/')
        })
}

// nedan ska endast fungera i browsers enligt dokumentationen (blob-apin, vad det nu är, finns inte på node så kan inte testa exakt hur det funkar), men osäker på hur man går till väga då
// console.log(calendar.toURL())