const fs = require("fs")
const path = require("path")

// Read the vanilla items file
const filePath = path.join(__dirname, "../data/items-vanilla.json")
const items = JSON.parse(fs.readFileSync(filePath, "utf8"))

// Find highest used ID
const vanillaIds = items.map((item) => item.id).filter((id) => id < 100000)
const maxId = Math.max(...vanillaIds)

console.log(`Current highest vanilla ID: ${maxId}`)
console.log(`Total items: ${items.length}`)

// Track seen IDs and assign new ones to duplicates
const seenIds = new Set()
let nextAvailableId = maxId + 1
let fixedCount = 0

items.forEach((item, index) => {
    if (seenIds.has(item.id)) {
        const oldId = item.id
        item.id = nextAvailableId
        console.log(
            `Fixed duplicate: ${item.name} (${oldId} → ${nextAvailableId})`
        )
        nextAvailableId++
        fixedCount++
    } else {
        seenIds.add(item.id)
    }
})

// Write the fixed data back
fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8")

console.log(`\n✅ Fixed ${fixedCount} duplicate IDs`)
console.log(`New ID range: ${maxId + 1} - ${nextAvailableId - 1}`)
console.log(`File updated: ${filePath}`)
