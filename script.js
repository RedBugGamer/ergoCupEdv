var lists = []

function handleAddedFile (file) {
  var fileListElem = document.getElementById('fileList')
  lists.push(file)

  var oneFileElem = document.createElement('div')
  oneFileElem.innerHTML = file.name
  oneFileElem.dataset.index = lists.length - 1
  fileListElem.appendChild(oneFileElem)

  var removeFileElem = document.createElement('button')
  removeFileElem.innerHTML = 'X'
  oneFileElem.appendChild(removeFileElem)

  removeFileElem.addEventListener('click', event => {
    const parent = event.target.parentElement
    const index = parent.dataset.index
    lists.splice(index, 1)
    parent.remove()
    document.getElementById('calculateBtn').disabled = lists.length === 0
  })
}

function fileInputEvent () {
  var fileInput = document.getElementById('excelFileInput')

  for (let i = 0; i < fileInput.files.length; i++) {
    var file = fileInput.files[i]
    handleAddedFile(file)
  }
  fileInput.value = ''
  document.getElementById('calculateBtn').disabled = lists.length === 0
}

function createListOfStudents () {
  return new Promise((resolve, reject) => {
    var students = []
    var filesProcessed = 0

    lists.forEach(function (file) {
      var reader = new FileReader()
      reader.onload = function (e) {
        var data = new Uint8Array(e.target.result)
        var workbook = XLSX.read(data, { type: 'array' })
        var firstSheetName = workbook.SheetNames[0]
        var worksheet = workbook.Sheets[firstSheetName]
        var sheetData = XLSX.utils.sheet_to_json(worksheet)

        sheetData.forEach(function (student) {
          if (!isNaN(student.Distanz)) {
            students.push({
              Name: student.Name,
              Vorname: student.Vorname,
              Klasse: student.Klasse,
              Geschlecht: student.Geschlecht,
              Distanz: student.Distanz
            })
          }
        })

        filesProcessed++
        if (filesProcessed === lists.length) {
          resolve(students)
        }
      }
      reader.onerror = function (error) {
        reject(error)
      }
      reader.readAsArrayBuffer(file)
    })
  })
}
// function calculateTopStudents(students) {

// }
function filterBy (students, filter) {
  var maxStudents = document.getElementById('maxN').value
  var out = []
  var allDistances=new Set()
  for (let i = 0; i < students.length; i++) {
    var student = students[i]
    if (filter(student) && (out.length < maxStudents || allDistances.has(student.Distanz))) {
      allDistances.add(student.Distanz)
      out.push(student)
    }
  }
  return out
}
function filterGeneral (student) {
  return true
}
function filterGirls(student) {
    return student.Geschlecht.toLowerCase()=="w"
}
function filterBoys(student) {
    return student.Geschlecht.toLowerCase()=="m"
}
function createCategoryContentElem (students) {
  var data = [[]]
  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    var individualPlace = data[data.length - 1]

    if (individualPlace.length === 0) {
      individualPlace.push(student)
    } else {
      if (
        student.Distanz === individualPlace[individualPlace.length - 1].Distanz
      ) {
        individualPlace.push(student)
      } else {
        data.push([])
        data[data.length - 1].push(student)
      }
    }
  }
//   data = data.reverse()

  var out = document.createElement('div')
  var placeIndex = 0
  data.forEach(function (place) {
    var placeElem = document.createElement('span')
    var nextDisplacement = -1;
    place.forEach(function (student) {
        placeIndex++
        nextDisplacement++
        placeElem.innerHTML +=
        student.Vorname +
        ' ' +
        student.Name +
        ' ' +
        student.Klasse +
        ' ' +
        student.Distanz +
        'm; '
    })
    placeElem.innerHTML = '' + placeIndex-nextDisplacement + '. '+placeElem.innerHTML.slice(0,placeElem.innerHTML.length-2)
    out.appendChild(placeElem)
    out.appendChild(document.createElement('br'))
  })
  return out
}
function createCategoryElem(title,students) {
    var elem = document.createElement("div")
    var header = document.createElement("h2")
    header.innerText=title
    elem.appendChild(header)
    elem.appendChild(createCategoryContentElem(students))

    return elem
}
function createStatisticsElem(students) {
    var elem = document.createElement("div")
    var header = document.createElement("h2")
    header.innerText="Statistik:"
    elem.appendChild(header)

    var totalDistance = 0
    students.forEach(function(student){totalDistance+=student.Distanz})
    var distanceElem = document.createElement("span")
    distanceElem.innerText="Gesamte Strecke: "+totalDistance
    elem.appendChild(distanceElem)
    elem.appendChild(document.createElement("br"))

    var averageElem = document.createElement("span")
    averageElem.innerText="Druchschnittliche Strecke: "+Math.round(totalDistance/students.length)
    elem.appendChild(averageElem)

    return elem
}
function createBestClassElem() {
    var elem = document.createElement("div")
    var header = document.createElement("h2")
    header.innerText="Beste Klassen:"
    elem.appendChild(header)
}
async function calculate () {
  var students = await createListOfStudents()
  var resultsElem = document.getElementById('result')
  resultsElem.innerHTML=""
  students = students.sort(function (a, b) {
    return b.Distanz - a.Distanz
  })
  resultsElem.appendChild(createStatisticsElem(students))
  resultsElem.appendChild(createCategoryElem("Beste Schüler:",filterBy(students, filterGeneral)))
  resultsElem.appendChild(createCategoryElem("Beste Mädchen:",filterBy(students, filterGirls)))
  resultsElem.appendChild(createCategoryElem("Beste Jungs:",filterBy(students, filterBoys)))
}
