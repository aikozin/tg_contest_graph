var colorBackground = [];

function drawGraph(divId, canvasName, numberGraphOnArray) {
    //частота кадров сцены
    var fps = 60;
    //массив с цветами графиков для дневного и ночного режимов [цвет][изменился ли цвет]
    colorBackground[divId] = "#fff";
    //массив с названиями месяцов
    var monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Avg", "Sen", "Oct", "Nov", "Dec"]
    //массив с днями недели
    var dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    //первый и последний элемент в массиве для построения графика
    var firstElement = 0;
    var lastElement = 0;
    //левая граница диапазона с замедленным движением
    var rangeVelocity = 0;
    //предыдущие верхняя граница большого графика (нижняя всегда 0)
    var rangeCompMaxBig = -1;
    var compMaxBig = 0;
    //отступ между линиями по оси y
    var a = 0;
    var ax = -1;
    //коэффициент изменения графика по X
    var scale = 0;
    //анимация маленького графика рисуется и массив, содержащий какие чекбоксы были выбраны ранее
    var isAnimate = false;
    var startAnimate = true;
    var ySelectBefore = [];
    
    var buttons = [];

    //Получаем содержимое json файл и парсим в chart_data
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'chart_data.json', false);
    xhr.send();
    if (xhr.status != 200)
        alert(xhr.status + ': ' + xhr.statusText);
    //расшифровал json и получил количество графиков
    var chart_data = JSON.parse(xhr.responseText);
    for (var countOfY = 0; chart_data[numberGraphOnArray].columns[countOfY] != undefined; countOfY++);
    countOfY--;
    //количество точек в графике
    var lengthArray = chart_data[numberGraphOnArray].columns[0].length;
    //массив с x
    var xMass = chart_data[numberGraphOnArray].columns[0];
    var yMass = []; //массив с y
    var graphName = []; //массив с названиями графиков
    var ySelect = []; //массив с состоянием чекбоксов
    //в зависимости от количество графиков заполнил перечисленные выше массивы значениями,
    //состояниями чекбоксов, именами графиков
    for (var i = 1; i <= countOfY; i++) {
        yMass.push(chart_data[numberGraphOnArray].columns[i]);
        ySelect.push(true);
        graphName.push(chart_data[numberGraphOnArray].names["y" + (i - 1)]);
    }

    var canvas = document.getElementById(canvasName),
        ctx = canvas.getContext('2d');
    canvas.width = document.getElementById(divId).clientWidth * 0.9;
    canvas.height = canvas.width * 1.15;
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.width;
    
    //массив с цветами
    var colorsY = [];
    for (var i = 0; i <= countOfY - 1; i++) {
        colorsY.push(chart_data[numberGraphOnArray].colors["y" + i]);
    }
    
    paintButtons();

    var coordinateX = [0];
    for (var i = 1; i <= lengthArray; i++) {
        coordinateX.push(i * canvasWidth / lengthArray);
    }
    var coordinateXScale = [0];

    //границы прямоугольника для выбора диапазона
    var rangeLeft = canvasWidth * 0.7;
    var rangeRight = canvasWidth;

    var scopeMin = [];
    var scopeMax = [];
    //нашел минимальное и максимальное значение для каждого y
    //и записал в массив
    for (var j = 0; j <= ySelect.length - 1; j++) {
        var max = 0;
        var min = -1;
        for (var i = 1; i <= lengthArray; i++) {
            if (yMass[j][i] > max)
                max = yMass[j][i];
            if (min == -1)
                min = yMass[j][i];
            if (yMass[j][i] < min)
                min = yMass[j][i];
        }
        scopeMin[j] = min;
        scopeMax[j] = max;
    }

    //границы построения маленького графика
    var minpix = canvasHeight * 0.915;
    var maxpix = canvasHeight * 0.985;
    //границы построения большого графика
    var minpixBig = canvasHeight * 0.04;
    var maxpixBig = canvasHeight * 0.8;
    var sizeBigGraph = canvasHeight * 0.8 - canvasHeight * 0.04;

    //расстояние между отрезками по y
    a = calcRangeY();

    watchRange();

    //##########################################################################################################
    //клик по кнопке
    function clickCheckBox(numCheckBoxClick) {
        rangeCompMaxBig--;
        for (var i = 0; i <= countOfY - 1; i++) {
            if (numCheckBoxClick == i) {
                ySelect[i] = !ySelect[i];
                ySelectBefore[i] = !ySelect[i];
            } else {
                ySelect[i] = ySelect[i];
                ySelectBefore[i] = ySelect[i];
            }
        }

        a = calcRangeY();

        paintButtons();
        startAnimate = true;
    }

    //##########################################################################################################
    //анимирование маленького графика
    function animGraph() {        
        isAnimate = true;
        if (ySelectBefore == 0)
            ySelectBefore[0] = false;
        //количество кадров
        var frameNum = 1;

        startAnimate = false;

        //нахожу минимальное и максимальное значение во всех выбранных графиках для последющего вычитания
        var compMax = 0;
        var compMin = -1;
        for (var i = 0; i <= ySelect.length; i++) {
            if (ySelect[i]) {
                if (scopeMax[i] > compMax)
                    compMax = scopeMax[i];
                if (compMin == -1)
                    compMin = scopeMin[i];
                if (scopeMin[i] < compMin)
                    compMin = scopeMin[i];
            }
        }
        //нахожу минимальное и максимальное значение для рисования предыдущих линий
        var compMaxBefore = 0;
        var compMinBefore = -1;
        for (var i = 0; i <= ySelectBefore.length; i++) {
            if (ySelectBefore[i]) {
                if (scopeMax[i] > compMaxBefore)
                    compMaxBefore = scopeMax[i];
                if (compMinBefore == -1)
                    compMinBefore = scopeMin[i];
                if (scopeMin[i] < compMinBefore)
                    compMinBefore = scopeMin[i];
            }
        }

        //нахожу требуемый коэффициент для текущего графика
        var coeff = (compMax - compMin) / (maxpix - minpix);
        //нахожу требуемый коэффициент для предыдущего графика
        var coeffBefore = (compMaxBefore - compMinBefore) / (maxpix - minpix);
        var frameMax = 20; //количество кадров (задается продолжительность анимации)
        var interval = setInterval(function () {   
            //толщина линии графика
            ctx.lineWidth = canvasWidth * 0.003;
            if (frameNum == frameMax) {
                isAnimate = false;
                clearInterval(interval);
            }

            //очистил 'экран' для маленького графика
            ctx.fillStyle = colorBackground[divId];
            ctx.fillRect(0, canvasHeight * 0.9, canvasWidth, canvasHeight * 0.1);

            //рисования прямоугольника выбора диапазона
            ctx.fillStyle = "rgba(137, 155, 171, 0.3)";
            ctx.fillRect(rangeLeft, canvasHeight * 0.9, canvasWidth * 0.012, canvasHeight * 0.1);
            ctx.fillRect(rangeRight - canvasWidth * 0.012, canvasHeight * 0.9, canvasWidth * 0.012, canvasHeight * 0.1);
            ctx.fillRect(rangeLeft + canvasWidth * 0.012, canvasHeight * 0.9, rangeRight - canvasWidth * 0.012 - rangeLeft - canvasWidth * 0.012, canvasHeight * 0.003);
            ctx.fillRect(rangeLeft + canvasWidth * 0.012, canvasHeight - canvasHeight * 0.003, rangeRight - canvasWidth * 0.012 - rangeLeft - canvasWidth * 0.012, canvasHeight * 0.003);

            //рисование появления линий
            for (var i = 0; i <= ySelect.length; i++) {
                if (ySelect[i]) {
                    ctx.beginPath();
                    ctx.strokeStyle = colorsY[i];
                    ctx.moveTo(0, maxpix - (yMass[i][1] - compMin) / coeff * frameNum / frameMax);
                    for (var j = 1; j <= lengthArray; j++) {
                        ctx.lineTo(j * canvasWidth / lengthArray, maxpix - (yMass[i][j] - compMin) / coeff * frameNum / frameMax);
                    }
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            //рисования пропадания старого графика
            var alpha = 1;
            for (var i = 0; i <= ySelectBefore.length; i++) {
                if (ySelectBefore[i]) {
                    ctx.beginPath();
                    ctx.strokeStyle = colorsY[i];
                    alpha = (frameMax / 1.5 - frameNum) / frameMax;
                    if (alpha < 0)
                        alpha = 0;
                    ctx.globalAlpha = alpha;
                    ctx.moveTo(0, maxpix - (yMass[i][1] - compMinBefore) / coeffBefore);
                    for (var j = 1; j <= lengthArray; j++) {
                        ctx.lineTo(j * canvasWidth / lengthArray, maxpix - (yMass[i][j] - compMinBefore) / coeffBefore);
                    }
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }

            //рисование прямоугольников с прозрачностью на невыделенных прямоугольником выделения областях
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(0, canvasHeight * 0.9, rangeLeft, canvasHeight * 0.1);
            ctx.fillRect(rangeRight, canvasHeight * 0.9, canvasWidth - rangeRight, canvasHeight * 0.1);
            
            paintBigGraph();
            frameNum++;
        }, 1000 / fps);
    }

    //##########################################################################################################
    //рисование маленького графика после анимации
    function paintRange() {        
        //нахожу минимальное и максимальное значение во всех выбранных графиках для последющего вычитания
        var compMax = 0;
        var compMin = -1;
        for (var i = 0; i <= ySelect.length; i++) {
            if (ySelect[i]) {
                if (scopeMax[i] > compMax)
                    compMax = scopeMax[i];
                if (compMin == -1)
                    compMin = scopeMin[i];
                if (scopeMin[i] < compMin)
                    compMin = scopeMin[i];
            }
        }
        //нахожу требуемый коэффициент для текущего графика
        var coeff = (compMax - compMin) / (maxpix - minpix);
        //очистил 'экран' для маленького графика
        ctx.fillStyle = colorBackground[divId];
        ctx.fillRect(0, canvasHeight * 0.9, canvasWidth, canvasHeight * 0.1);

        //рисования прямоугольника выбора диапазона
        ctx.fillStyle = "rgba(137, 155, 171, 0.3)";
        ctx.fillRect(rangeLeft, canvasHeight * 0.9, canvasWidth * 0.012, canvasHeight * 0.1);
        ctx.fillRect(rangeRight - canvasWidth * 0.012, canvasHeight * 0.9, canvasWidth * 0.012, canvasHeight * 0.1);
        ctx.fillRect(rangeLeft + canvasWidth * 0.012, canvasHeight * 0.9, rangeRight - canvasWidth * 0.012 - rangeLeft - canvasWidth * 0.012, canvasHeight * 0.003);
        ctx.fillRect(rangeLeft + canvasWidth * 0.012, canvasHeight - canvasHeight * 0.003, rangeRight - canvasWidth * 0.012 - rangeLeft - canvasWidth * 0.012, canvasHeight * 0.003);

        ctx.lineWidth = canvasWidth * 0.003;

        //рисование появления линий
        for (var i = 0; i <= ySelect.length; i++) {
            if (ySelect[i]) {
                ctx.beginPath();
                ctx.strokeStyle = colorsY[i];
                ctx.moveTo(0, maxpix - (yMass[i][1] - compMin) / coeff);
                for (var j = 1; j <= lengthArray; j++) {
                    ctx.lineTo(j * canvasWidth / lengthArray, maxpix - (yMass[i][j] - compMin) / coeff);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
        //рисование прямоугольников с прозрачностью на невыделенных прямоугольником выделения областях
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, canvasHeight * 0.9, rangeLeft, canvasHeight * 0.1);
        ctx.fillRect(rangeRight, canvasHeight * 0.9, canvasWidth - rangeRight, canvasHeight * 0.1);
        
        paintBigGraph();
    }

    //##########################################################################################################
    //слежение за изменениями в графиках и реакция на них
    function watchRange() {
        var medium = (rangeRight + rangeLeft) / 2;
        rangeVelocity = medium;
        setInterval(function () {
            medium = (rangeRight + rangeLeft) / 2;
            if (colorBackground[divId] == "day") {
                rangeCompMaxBig--;
                colorBackground[divId] = "#fff";
                paintButtons();
            }
            if (colorBackground[divId] == "night") {
                rangeCompMaxBig--;
                colorBackground[divId] = "#242f3e";
                paintButtons();
            }
                
            if (rangeVelocity != medium || rangeCompMaxBig != compMaxBig || rangeCompMaxBig == -1) {
                if (rangeVelocity > medium) {
                    rangeVelocity -= (rangeVelocity - medium) / (fps / 10);
                    if (rangeVelocity - medium < 0.2)
                        rangeVelocity = medium;
                }
                else {
                    rangeVelocity += (medium - rangeVelocity) / (fps / 10);
                    if (medium - rangeVelocity < 0.2)
                        rangeVelocity = medium;
                }

                scale = canvasWidth / (rangeRight - rangeLeft);
                for (var i = 1; i <= lengthArray; i++) {
                    coordinateXScale[i] = coordinateX[i] * scale;
                }

                firstElement = Math.round(rangeLeft / canvasWidth * lengthArray) + 1;
                lastElement = Math.round(rangeRight / canvasWidth * lengthArray);
                //нахожу минимальное и максимальное значение во всех выбранных графиках для последющего вычитания
                compMaxBig = 0;
                for (var j = 0; j <= ySelect.length; j++) {
                    for (var i = firstElement; i <= lastElement; i++) {
                        if (ySelect[j])
                            compMaxBig = yMass[j][i] > compMaxBig ? yMass[j][i] : compMaxBig;
                    }
                }
                if (rangeCompMaxBig == -1)
                    rangeCompMaxBig = compMaxBig;
                if (rangeCompMaxBig > compMaxBig) {
                    rangeCompMaxBig -= (rangeCompMaxBig - compMaxBig) / (fps / 10);
                        if (rangeCompMaxBig - compMaxBig < 0.2)
                            rangeCompMaxBig = compMaxBig;
                } else {
                    rangeCompMaxBig += (compMaxBig - rangeCompMaxBig) / (fps / 10);
                    if (compMaxBig - rangeCompMaxBig < 0.2)
                        rangeCompMaxBig = compMaxBig;
                }

                if (startAnimate) 
                    animGraph();
                else
                    if (!isAnimate)
                        paintRange();
            }
        }, 1000 / fps);
    }

    //##########################################################################################################
    //рисование большого графика и горизонтальных линий
    function paintBigGraph() {
        //нахожу требуемый коэффициент для текущего графика
        var coeffBig = rangeCompMaxBig / (maxpixBig - minpixBig);
        //толщина линии графика
        ctx.lineWidth = canvasWidth * 0.006;
        //очистил 'экран' для большого графика
        ctx.fillStyle = colorBackground[divId];
        ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.9);

        for (var i = 0; i <= 5; i++) {
            //рисование горизонтальных линий
            ctx.fillStyle = "rgba(137, 155, 190, 0.3)";
            ctx.fillRect(0, maxpixBig - a * (sizeBigGraph / rangeCompMaxBig) * i, canvasWidth, canvasHeight * 0.002);
            //надписи на оси y
            ctx.fillStyle = "rgba(137, 155, 190, 0.7)";
            ctx.font = canvasWidth * 0.025 + "px Arial";
            ctx.textBaseline = "middle";
            ctx.fillText(Math.floor(a * i), 0, maxpixBig - a * (sizeBigGraph / rangeCompMaxBig) * i - canvasHeight * 0.015);
        }

        //рисование линий
        for (var i = 0; i <= ySelect.length; i++) {
            if (ySelect[i]) {
                ctx.strokeStyle = colorsY[i];
                for (var j = 1; j <= lengthArray; j++) {
                    ctx.beginPath();
                    ctx.moveTo(coordinateXScale[j] - (rangeVelocity - (rangeRight - rangeLeft) / 2) * scale,
                        maxpixBig - yMass[i][j] / coeffBig);
                    ctx.lineTo(coordinateXScale[j + 1] - (rangeVelocity - (rangeRight - rangeLeft) / 2) * scale,
                        maxpixBig - yMass[i][j + 1] / coeffBig);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
        }

        //вывод текста на оси x
        var intervalData = Math.floor((lastElement - firstElement) / 5);
        for (var i = 1; i <= lengthArray; i += intervalData) {
            //надписи на оси x
            ctx.fillStyle = "rgba(137, 155, 190, 0.7)";
            ctx.font = canvasWidth * 0.03 + "px Arial";
            ctx.textBaseline = "middle";
            var date = new Date(xMass[i]);
            ctx.fillText(monthName[date.getMonth()] + " " + date.getDate(),
                coordinateXScale[i] - (rangeVelocity - (rangeRight - rangeLeft) / 2) * scale - 20, canvasHeight * 0.83);
        }
    }

    //##########################################################################################################
    //Настройка событий по кликам и тачам на экране
    var isClickLeft = false; //нажали или нет на левую границу диапазона
    var isClickRight = false; //нажали или нет на правую границу диапазона
    var isClickCenter = false; //нажали или нет на центральную часть диапазона
    var rangeLeftIfClickCenter = 0; //сохраняем позицию левой границы диапазона до клика
    var rangeRightIfClickCenter = 0; //сохраняем позицию правой границы диапазона до клика
    var x = 0,
        y = 0; //позиция курсора во время нажатия
    var indent = canvasWidth * 0.02; //отступ от границ в обе стороны для простого улавливания клика

    //нажатие мышкой
    canvas.addEventListener('mousedown', mdown);
    function mdown(event) {
        x = event.pageX - canvas.offsetLeft;
        y = event.pageY - canvas.offsetTop;
        if (x == undefined && y == undefined) {
            event.preventDefault();
            var touches = event.changedTouches;
            x = touches[0].pageX - canvas.offsetLeft;
            y = touches[0].pageY - canvas.offsetTop;
        }
        //клик на левую часть прямоугольника
        if (x >= rangeLeft - indent && x <= rangeLeft + indent &&
            y >= canvasHeight * 0.9 && y <= canvasHeight) {
            isClickLeft = true;
        }
        //клик на правую часть прямоугольника
        if (x >= rangeRight - indent && x <= rangeRight + indent &&
            y >= canvasHeight * 0.9 && y <= canvasHeight) {
            isClickRight = true;
        }
        //клик на центральную часть
        if (x >= rangeLeft + indent && x <= rangeRight - indent &&
            y >= canvasHeight * 0.9 && y <= canvasHeight) {
            isClickCenter = true;
            xClickCenter = x;
            rangeLeftIfClickCenter = rangeLeft;
            rangeRightIfClickCenter = rangeRight;
        }
        //клики на кнопки
        for (var i = 0; i <= countOfY - 1; i++) {
            if (x >= buttons[i][0] && x <= buttons[i][0] + buttons[i][2] &&
               y >= buttons[i][1] && x <= buttons[i][1] + buttons[i][3])
                clickCheckBox(i);
        }
        //клики на большой график
        if (x >= 0 && x <= canvasWidth && y >= minpixBig && y <= maxpixBig) {
            if (!isAnimate)
                paintExactData(x);
        }
    }

    //отжатие мышкой
    canvas.addEventListener('mouseup', mup);
    function mup(event) {
        isClickLeft = false;
        isClickRight = false;
        isClickCenter = false;
    }

    //движение мыши
    canvas.addEventListener('mousemove', mmove);
    function mmove(event) {
        if (isClickLeft) {
            x = event.pageX - canvas.offsetLeft;

            if (x <= rangeRight - 3 * indent) {
                rangeLeft = x;
            }
        }
        if (isClickRight) {
            x = event.pageX - canvas.offsetLeft;

            if (x >= rangeLeft + 3 * indent && x <= canvasWidth) {
                console.log(x + "    " + (rangeLeft + 2 * indent));
                rangeRight = x;
            }
        }
        if (isClickCenter) {
            x = event.pageX - canvas.offsetLeft;

            var newRangeLeft = rangeLeftIfClickCenter - (xClickCenter - x);
            var newRangeRight = rangeRightIfClickCenter - (xClickCenter - x);

            if (newRangeLeft > 0) {
                rangeLeft = newRangeLeft;
            } else {
                rangeLeft = 0;
                rangeRight = rangeRightIfClickCenter - rangeLeftIfClickCenter;
            }

            if (newRangeRight <= canvasWidth) {
                if (newRangeLeft > 0)
                    rangeRight = newRangeRight;
            } else {
                rangeRight = canvasWidth;
                rangeLeft = canvasWidth - (rangeRightIfClickCenter - rangeLeftIfClickCenter);
            }
        }
    }

    //выход указателя за пределы canvas
    canvas.addEventListener('mouseout', mout); 
    function mout(event) {
        if (isClickLeft)
            rangeLeft = 0;
        if (isClickRight)
            rangeRight = canvasWidth;
        isClickLeft = false;
        isClickRight = false;
        isClickCenter = false;
    }

    //##########################################################################################################
    //добавляем кнопки в canvas
    function paintButtons() {
        //очистил 'экран'
        ctx.fillStyle = colorBackground[divId];
        ctx.fillRect(0, canvasHeight, canvasWidth, canvasHeight * 1.15);
        
        ctx.lineWidth = canvasWidth * 0.003;
        var c = 0;
        for (var i = 1; i <= countOfY; i++) {
            ctx.font = canvasHeight * 0.035 + "px Arial";
            ctx.textBaseline = "middle";
            if (colorBackground[divId] == "#fff")
                ctx.fillStyle = "#000"
            else
                ctx.fillStyle = "#fff";
            ctx.fillText (graphName[i - 1], c + canvasWidth * 0.08, canvasHeight + canvasHeight * 0.088);
            var x = c,
                y = canvasHeight + canvasHeight * 0.05,
                w = canvasWidth * 0.1 + ctx.measureText(graphName[i - 1]).width,
                h = canvasHeight * 0.07;
            buttons.push([x, y, w,h]);
            roundRect(ctx, x, y, w, h, h / 2, false, true, "#888");//основной прямоугольник
            roundRect(ctx, c + canvasWidth * 0.015, canvasHeight + canvasHeight * 0.0635,
                canvasWidth * 0.045, canvasHeight * 0.045, canvasHeight * 0.0225, true, false,
                    ySelect[i - 1] ? colorsY[i - 1] : "#aab");//кружок внутри

            ctx.fillStyle = "#fff";
            ctx.font = canvasHeight * 0.03 + "px Arial";
            ctx.fillText ('✔', c + canvasWidth * 0.025, canvasHeight + canvasHeight * 0.09);
            
            c = c + canvasWidth * 0.15 + ctx.measureText(graphName[i - 1]).width;
        }    
    }

    //##########################################################################################################
    //рисование и вывод точного значения
    function paintExactData(xs) {
        paintBigGraph();
        var range = (coordinateXScale[1] - coordinateXScale[0]) / 2;
        var coordinateRange = (rangeVelocity - (rangeRight - rangeLeft) / 2) * scale;
        for (var i = 1; i <= lengthArray; i++) {
            if (coordinateXScale[i] - coordinateRange + range >= xs && 
                coordinateXScale[i] - coordinateRange - range <= xs) {
                if (yMass[0][i] == undefined)
                    break;
                var x = coordinateXScale[i] - coordinateRange;
                var y = canvasHeight * 0.04;
                var widthText = 0;
                var widthNum = 0;

                //рисование вертикальной прямой
                ctx.fillStyle = "rgba(137, 155, 190, 0.3)";
                ctx.fillRect(coordinateXScale[i] - coordinateRange, 0, canvasWidth * 0.002, maxpixBig);
                
                for (var j = 0; j <= ySelect.length; j++) {
                    if (ySelect[j]) {
                        roundRect(
                            ctx,
                            coordinateXScale[i] - coordinateRange - canvasWidth * 0.01,
                            maxpixBig - yMass[j][i] / (rangeCompMaxBig / (maxpixBig - minpixBig)) - canvasWidth * 0.01,
                            canvasWidth * 0.02,
                            canvasWidth * 0.02,
                            canvasWidth * 0.01,
                            true, false, colorBackground[divId]
                        );
                        roundRect(
                            ctx,
                            coordinateXScale[i] - coordinateRange - canvasWidth * 0.01,
                            maxpixBig - yMass[j][i] / (rangeCompMaxBig / (maxpixBig - minpixBig)) - canvasWidth * 0.01,
                            canvasWidth * 0.02,
                            canvasWidth * 0.02,
                            canvasWidth * 0.01,
                            false, true, colorsY[j], canvasWidth * 0.006
                        );
                    }
                }

                //получение даты
                var date = new Date(xMass[i]);
                var textDate = dayName[date.getDay()] + ", " + monthName[date.getMonth()] + " " + date.getDate();
                //получение ширины выведенной даты
                widthText = ctx.measureText(textDate).width;
                widthNum = canvasWidth * 0.02;
                var numd = 0;
                for (var j = 0; j <= ySelect.length; j++) {
                    if (ySelect[j]) {
                        widthNum += ctx.measureText(yMass[j][i]).width + canvasWidth * 0.02 * numd;
                        numd++;
                    }
                }
                widthNum += canvasWidth * 0.02;
                if (widthNum > widthText)
                    widthText = widthNum;
                x -= (widthText + canvasWidth * 0.04) / 2;
                if (x + widthText + canvasWidth * 0.04 > canvasWidth)
                    x = canvasWidth - widthText - canvasWidth * 0.04;
                if (x <= 0)
                    x = 1;
                for (var j = 0; j <= ySelect.length; j++) {
                    if (ySelect[j]) {
                        if (maxpixBig - yMass[j][i] / (rangeCompMaxBig / (maxpixBig - minpixBig)) < canvasHeight * 0.11)
                            y = maxpixBig - canvasHeight * 0.11
                    }
                }

                roundRect(
                    ctx,
                    x,
                    y,
                    widthText + canvasWidth * 0.04,
                    canvasHeight * 0.11,
                    canvasHeight * 0.02,
                    true, true, colorBackground[divId] == "#fff" ? "#fff" : "#242f3e"
                    );
                roundRect(
                    ctx,
                    x,
                    y,
                    widthText + canvasWidth * 0.04,
                    canvasHeight * 0.11,
                    canvasHeight * 0.02,
                    false, true, "#aaa"
                    );

                //вывод выбранной даты
                if (colorBackground[divId] == "#fff")
                    ctx.fillStyle = "#000"
                else
                    ctx.fillStyle = "#fff";
                ctx.font = canvasWidth * 0.025 + "px Arial";
                ctx.textBaseline = "hanging";
                ctx.fillText(textDate, x + canvasWidth * 0.02, y + canvasHeight * 0.01);
                
                var numd = 0;
                for (var j = 0; j <= ySelect.length; j++) {
                    if (ySelect[j]) {
                        ctx.fillStyle = colorsY[j];
                        ctx.font = canvasWidth * 0.035 + "px Arial";
                        ctx.textBaseline = "start";
                        var p = 0;
                        if (j - 1 >= 0)
                            if (ySelect[j])
                                p = ctx.measureText(yMass[j - 1][i]).width * numd;
                        var xx = x + canvasWidth * 0.02 + p + canvasWidth * 0.02 * numd;
                        ctx.fillText(
                            yMass[j][i],
                            xx,
                            y + canvasHeight * 0.04
                        );
                        console.log(j - 1 >= 0 ? ctx.measureText(yMass[j - 1][i]).width : 0);
                        ctx.font = canvasWidth * 0.025 + "px Arial";
                        ctx.fillText(
                            graphName[j],
                            xx,
                            y + canvasHeight * 0.08
                        );
                        numd++;
                    }
                }
            }
        }
    }

    //##########################################################################################################
    //расстояние между отрезками по y
    function calcRangeY () {
        var tempMax = 0;
        for (var j = 0; j <= ySelect.length - 1; j++)
            if (ySelect[j])
                for (var i = 1; i <= lengthArray; i++) 
                    if (yMass[j][i] > tempMax)
                        tempMax = yMass[j][i];

        var a = Math.floor(tempMax / 5);
        var b = a;
        var numDigits = 0;
        while (b > 0) {
            b = Math.floor(b / 10);
            numDigits++;
        }
        a = a - a % (10 * (numDigits - 1));
        return a;
    }
    
    function roundRect(ctx, x, y, width, height, radius, fill, stroke, color, lineW) {
        if (typeof stroke == "undefined")
            stroke = true;
        if (typeof radius === "undefined")
            radius = 5;
        if (typeof lineW == "undefined")
            lineW = canvasWidth * 0.001;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, 0, false);
        ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5, false);
        ctx.arc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI, false);
        ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = color;
            ctx.fill();
        }
        if (stroke) 
            ctx.stroke();
    }
}

function switchMode(divId) {
    var div = document.getElementById(divId);
    if (colorBackground[divId] == "#fff") {
        colorBackground[divId] = "night";
        div.style.background = "#242f3e";
        document.getElementById("text" + divId).textContent = "Switch To Day Mode";
        document.getElementById("title" + divId).style.color = "#fff";
    }
    else {
        colorBackground[divId] = "day";
        div.style.background = "#fff";   
        document.getElementById("text" + divId).textContent = "Switch To Night Mode";
        document.getElementById("title" + divId).style.color = "#000";
    }
}