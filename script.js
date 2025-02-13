var lists = []
const defaultText = `<br>
            Hier werden später die Ergebnisse angezeigt.
            <br>
            <h2>Info:</h2>
            Die Seite unterstützt das Hochladen von mehreren Dateien. So kann man z.B. eine Datei pro Jahrgangstufe/Klasse haben. <b>Die erste Zeile jeder Datei muss mit der Vorlage übereinstimmen! </b>(Die Farbe ist egal)
            <h2 style="color: red;">Warnung:</h2> 
            Es ist möglich, dass bei z.B. der folgenden Verteilung mehr Schüler als erwartet in die Siegerehrung kommen. Dieser Ausnahmefall ist jedoch sehr unwahrscheinlich und entsteht nur, wenn mehrere Schüler auf dem letzten gezeigten Platz die selbe Strecke haben.
            <h3>Beispiel:</h3>
            1. Max Mustermann 1000m
            <br>
            2. Hans Müller 900m
            <br>
            3. Peter Meyer 800m
            <br>
            4. Lisa Schmidt 700m
            <br>
            5. Julia Schulz 600m; <span style="color: red;">Stefan Fischer 600m</span>`
function handleAddedFile (file) {
  var fileListElem = document.getElementById('fileList')
  lists.push(file)

  var oneFileElem = document.createElement('div')
  oneFileElem.innerHTML = file.name
  oneFileElem.dataset.index = lists.length - 1
  oneFileElem.classList.add('files')
  fileListElem.appendChild(oneFileElem)

  var removeFileElem = document.createElement('button')
  removeFileElem.innerHTML = '❌'
  removeFileElem.classList.add('removeButtons')
  oneFileElem.appendChild(removeFileElem)

  removeFileElem.addEventListener('click', event => {
    const parent = event.target.parentElement
    const index = parent.dataset.index
    lists.splice(index, 1)
    parent.remove()
    if (lists.length>0) calculate()
      else {
        var resultsElem = document.getElementById('result')
        resultsElem.innerHTML = defaultText
      }
  })
  calculate()
}
function maxNOnChange () {
  var maxStudents = document.getElementById('maxN').value
  if (maxStudents !== '') calculate()
}
function fileInputEvent () {
  var fileInput = document.getElementById('excelFileInput')

  for (let i = 0; i < fileInput.files.length; i++) {
    var file = fileInput.files[i]
    handleAddedFile(file)
  }
  fileInput.value = ''
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
        var errorText = ''
        var genderWarn = ''
        sheetData.forEach(function (student) {
          if (
            !isNaN(student.Distanz) &&
            typeof student.Distanz === 'number' &&
            /^\d+$/.test(student.Distanz.toString().trim())
          ) {
            students.push({
              Name: student.Name,
              Vorname: student.Vorname,
              Klasse: student.Klasse,
              Geschlecht: student.Geschlecht,
              Distanz: student.Distanz
            })
            if (
              student.Geschlecht.toLowerCase() !== 'w' &&
              student.Geschlecht.toLowerCase() !== 'm'
            ) {
              genderWarn +=
                student.Vorname +
                ' ' +
                student.Name +
                ' ' +
                student.Klasse +
                ' ' +
                student.Geschlecht +
                '\n'
            }
          } else if (
            student.Distanz !== '' &&
            student.Distanz !== undefined &&
            student.Distanz !== null
          ) {
            errorText +=
              student.Vorname + ' ' + student.Name + ' ' + student.Klasse + '\n'
          }
        })
        if (errorText !== '') {
          alert(
            'Die folgenden Schüler enthalten Fehler:\n' +
              errorText +
              'z.B. Lehrzeichen können Probleme bereiten. Diese Schüler werden von der Berechnung ausgeschlossen'
          )
        }
        if (genderWarn !== '') {
          alert(
            'Das Geschlecht der folgenden Schüler kann nicht gelesen werden:\n' +
              genderWarn +
              'Die Schüler werden trotzdem in allgemeinen Rechnungen eingeschlossen.'
          )
        }

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

function filterBy (students, filter, ignoreMaxN = false) {
  var maxStudents = document.getElementById('maxN').value
  var out = []
  var allDistances = new Set()
  for (let i = 0; i < students.length; i++) {
    var student = students[i]
    if (
      filter(student) &&
      (out.length < maxStudents ||
        allDistances.has(student.Distanz) ||
        ignoreMaxN)
    ) {
      allDistances.add(student.Distanz)
      out.push(student)
    }
  }
  return out
}
function filterGeneral (student) {
  return true
}
function filterGirls (student) {
  return student.Geschlecht.toLowerCase() == 'w'
}
function filterBoys (student) {
  return student.Geschlecht.toLowerCase() == 'm'
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
    var nextDisplacement = -1
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
    placeElem.innerHTML =
      '' +
      placeIndex -
      nextDisplacement +
      '. ' +
      placeElem.innerHTML.slice(0, placeElem.innerHTML.length - 2)
    out.appendChild(placeElem)
    out.appendChild(document.createElement('br'))
  })
  return out
}
function createCategoryElem (title, students) {
  var elem = document.createElement('div')
  var header = document.createElement('h2')
  header.innerText = title
  elem.appendChild(header)
  elem.appendChild(createCategoryContentElem(students))

  return elem
}
function createStatisticsElem (students) {
  var elem = document.createElement('div')
  var header = document.createElement('h2')
  header.innerText = 'Statistik:'
  elem.appendChild(header)

  var totalDistance = 0
  students.forEach(function (student) {
    totalDistance += student.Distanz
  })
  var distanceElem = document.createElement('span')
  distanceElem.innerText = 'Gesamte Strecke: ' + totalDistance + 'm'
  elem.appendChild(distanceElem)
  elem.appendChild(document.createElement('br'))

  var averageElem = document.createElement('span')
  averageElem.innerText =
    'Durchschnittliche Strecke: ' +
    Math.round(totalDistance / students.length) +
    'm'
  elem.appendChild(averageElem)
  elem.appendChild(document.createElement('br'))

  var totalElem = document.createElement('span')
  totalElem.innerText = 'Anzahl Schüler: ' + students.length
  elem.appendChild(totalElem)
  elem.appendChild(document.createElement('br'))

  var totalBoysElem = document.createElement('span')
  totalBoysElem.innerText =
    'Anzahl Jungs: ' + filterBy(students, filterBoys, true).length
  elem.appendChild(totalBoysElem)
  elem.appendChild(document.createElement('br'))

  var totalGrilsElem = document.createElement('span')
  totalGrilsElem.innerText =
    'Anzahl Mädchen: ' + filterBy(students, filterGirls, true).length
  elem.appendChild(totalGrilsElem)

  return elem
}
function createClassesContentElem (classes) {
  var data = [[]]
  for (let i = 0; i < classes.length; i++) {
    const singleClass = { Name: classes[i][0], Distanz: classes[i][1].Distanz }
    var individualPlace = data[data.length - 1]

    if (individualPlace.length === 0) {
      individualPlace.push(singleClass)
    } else {
      if (
        singleClass.Distanz ===
        individualPlace[individualPlace.length - 1].Distanz
      ) {
        individualPlace.push(singleClass)
      } else {
        data.push([])
        data[data.length - 1].push(singleClass)
      }
    }
  }
  //   data = data.reverse()

  var out = document.createElement('div')
  var placeIndex = 0
  data.forEach(function (place) {
    var placeElem = document.createElement('span')
    var nextDisplacement = -1
    place.forEach(function (singleClass) {
      placeIndex++
      nextDisplacement++
      placeElem.innerHTML +=
        singleClass.Name + ' ' + singleClass.Distanz + 'm; '
    })
    placeElem.innerHTML =
      '' +
      placeIndex -
      nextDisplacement +
      '. ' +
      placeElem.innerHTML.slice(0, placeElem.innerHTML.length - 2)
    out.appendChild(placeElem)
    out.appendChild(document.createElement('br'))
  })
  return out
}
function createBestClassRelativeElem (students) {
  var elem = document.createElement('div')
  var header = document.createElement('h2')
  header.innerText = 'Beste Klassen (Relativ):'
  elem.appendChild(header)

  var uniqueClasses = new Set()
  var classes = {}
  students.forEach(function (s) {
    if (uniqueClasses.has(s.Klasse)) {
      classes[s.Klasse].Distanz += s.Distanz
      classes[s.Klasse].nStudents++
    } else {
      classes[s.Klasse] = {
        Distanz: s.Distanz,
        nStudents: 1
      }
      uniqueClasses.add(s.Klasse)
    }
  })
  var sorted = Object.entries(classes).sort(function (a, b) {
    return b[1].Distanz / b[1].nStudents - a[1].Distanz / a[1].nStudents
  })

  elem.appendChild(createClassesContentElem(sorted))

  return elem
}
function createBestClassElem (students) {
  var elem = document.createElement('div')
  var header = document.createElement('h2')
  header.innerText = 'Beste Klassen (Absolut):'
  elem.appendChild(header)

  var uniqueClasses = new Set()
  var classes = {}
  students.forEach(function (s) {
    if (uniqueClasses.has(s.Klasse)) {
      classes[s.Klasse].Distanz += s.Distanz
    } else {
      classes[s.Klasse] = {
        Distanz: s.Distanz
      }
      uniqueClasses.add(s.Klasse)
    }
  })
  var sorted = Object.entries(classes).sort(function (a, b) {
    return b[1].Distanz - a[1].Distanz
  })

  elem.appendChild(createClassesContentElem(sorted))

  return elem
}
function getUniqueclasses (students) {
  var uniqueClasses = new Set()
  students.forEach(function (s) {
    uniqueClasses.add(s.Klasse)
  })

  return [...uniqueClasses]
}
function createListOfElementsClasses (students) {
  var uniqueClasses = getUniqueclasses(students)
  var elems = []
  uniqueClasses = uniqueClasses.sort()
  uniqueClasses.forEach(function (c) {
    function filterOneClass (student) {
      return student.Klasse == c
    }
    elems.push(createCategoryElem(c + ':', filterBy(students, filterOneClass)))
  })
  return elems
}
async function calculate () {
  var students = await createListOfStudents()
  var resultsElem = document.getElementById('result')
  resultsElem.innerHTML = ''
  students = students.sort(function (a, b) {
    return b.Distanz - a.Distanz
  })
  resultsElem.appendChild(createStatisticsElem(students))
  resultsElem.appendChild(createBestClassElem(students))
  resultsElem.appendChild(createBestClassRelativeElem(students))
  resultsElem.appendChild(
    createCategoryElem('Beste Schüler:', filterBy(students, filterGeneral))
  )
  resultsElem.appendChild(
    createCategoryElem('Beste Mädchen:', filterBy(students, filterGirls))
  )
  resultsElem.appendChild(
    createCategoryElem('Beste Jungs:', filterBy(students, filterBoys))
  )
  createListOfElementsClasses(students).forEach(function (elem) {
    resultsElem.appendChild(elem)
  })
  resultsElem.appendChild(createChartElem(students))
}
function generateDistribution (students) {
  var maxDistance = 0
  students.forEach(function (s) {
    if (s.Distanz > maxDistance) maxDistance = s.Distanz
  })
  maxDistance = Math.ceil(maxDistance / 100) * 100

  var xAxis = []
  var yAxis = []
  var xAxisDescriptive = []
  for (let i = 0; i < (maxDistance + 100) / 100; i++) {
    xAxis.push(i * 100)
    yAxis.push(0)
    xAxisDescriptive.push(i * 100 + 'm - ' + String(i * 100 + 99) + 'm')
  }

  for (let i = 0; i < xAxis.length; i++) {
    students.forEach(s => {
      if (s.Distanz >= xAxis[i] && s.Distanz < xAxis[i] + 100) {
        yAxis[i]++
      }
    })
  }
  return [xAxisDescriptive, yAxis]
}
function createChartElem (students) {
  var ctx = document.createElement('canvas')
  const [x, y] = generateDistribution(students)
  const [x_m, y_m] = generateDistribution(filterBy(students, filterBoys, true))
  const [x_w, y_w] = generateDistribution(filterBy(students, filterGirls, true))
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: x,
      datasets: [
        {
          label: 'Verteilung der Strecken',
          data: y,
          borderWidth: 1
        },
        {
          label: 'Verteilung der Strecken Mädchen',
          data: y_w,
          borderWidth: 1
        },
        {
          label: 'Verteilung der Strecken Jungs',
          data: y_m,
          borderWidth: 1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
  return ctx
}
