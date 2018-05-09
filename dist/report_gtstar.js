'use strict';

/**
 * Created by songfei on 2017/7/13.
 */
(function ($) {
    'use strict';

    $.reportGtstar = $.reportGtstar || {};
    var reportAlreadyConfig = []; //已经配置了指标的报表列表
    var count = 0;
    var baseUrl = common.getbaseUrl();
    console.log(baseUrl);
    var defaultSettings = {
        tableId: '', //
        filterSelector: '',
        barSelector: '', // 柱状图选择器
        pieSelector: '', // 饼状图选择器
        lineSelector: '', // 折线图选择器
        baseUrl: baseUrl,
        nesUrl: baseUrl + "nes/", //网元信息id
        reportUrl: baseUrl + "reportConfigs/", //获取报表信息的url
        configUrl: baseUrl + "reportConfigs/{0}/indicators", //根据reportId获取报表配置信息的URL
        filterUrl: baseUrl + "reportConfigs/{0}/filters", //根据reportId获取报表搜索信息的URL
        dataUrl: baseUrl + "reports/{0}/datas", //根据reportId获取报表数据的URL
        initReport: $.noop //初始化报表的方法
    };

    /**
     * 获得所有的报表全局配置信息
     * @param  {function} successCallBack 查询出结果后的回调函数
     */

    function getReports(successCallBack) {
        var rid = $.reportGtstar.currentData.reportId;
        var param = {
            url: defaultSettings.reportUrl + rid,
            methed: "GET",
            data: null,
            contentType: null,
            callback: successCallBack
        };
        // console.log(param.url)
        return common.sendAjax(param);
    }

    // 请求得到定制neid筛选条件多选框数据
    function getDataFilter(callback) {
        var param = {
            url: defaultSettings.nesUrl,
            methed: "GET",
            contentType: null,
            callback: callback
        };
        common.sendAjax(param);
    }

    getDataFilter(function (data) {
        $.reportGtstar.dataFilterList = data;
    });

    function configsCallBack(datas, reportId, successCallBack) {
        var config = $.reportGtstar.reportConfigsData;

        var indicatorConfig = datas.filter(function (item) {
            return item.enableFlag != 0;
        }).sort(function (item1, item2) {
            return item1.indicatorType > item2.indicatorType ? 1 : -1;
        });
        config['reportIndicatorConfig'] = indicatorConfig;
        successCallBack && successCallBack(config);

        reportAlreadyConfig.push(reportId);
    }

    /**
     * 1通过reportId 查询报表指标配置信息
     * @param  {number} reportId          [报表ID]
     * @param  {function} successCallBack [成功后的回调函数]
     * @return {[type]}                 [description]
     */
    //1通过reportId 查询报表指标配置信息
    function getReportConfigs(reportId, successCallBack) {
        if (reportAlreadyConfig.indexOf(reportId) == -1) {
            var configs = $.reportUtil.handleProp(defaultSettings.configUrl, reportId);
            var param = {
                url: configs,
                methed: "GET",
                data: null,
                contentType: null,
                callback: function callback(data) {
                    configsCallBack(data, reportId, successCallBack);
                }
            };
            common.sendAjax(param);
        } else {
            successCallBack && successCallBack($.reportGtstar.reportConfigsData);
        }
    }

    /**
     * 应该在这里检查配置是否正确 TODO
     * groupFlag取值：
     *     x1 ： 既可以是1，也可以0，
     *     x2 : 1,
     *     y1,y2 : 1
     *
     * 将指标配置信息转换成 理想的数据结构
     * {
    *   x : array[[object|array[object]], [object]] : 表头结构
    *   y : array[object{1,2}] : 列头结构
    *   z : object : 数据指标配置
    * }
     * 附： object == reportIndicatorConfig
     *
     * @param  {array[object]} reInConf              [description]  数据结构参考 reportIndicatorConfig
     * @return {array[[object|array]{1,2}]}          [description]
     */

    //2处理配置X,Y,Z 的信息
    function getTempConfsObj(reInConf) {
        var tempReInConfs = {};
        for (var i in reInConf) {
            var indicator = reInConf[i];
            if (indicator.indicatorType.startsWith("x") || indicator.indicatorType.startsWith("y")) {
                var axis = indicator.indicatorType.substr(0, 1);
                if (!tempReInConfs[axis]) {
                    tempReInConfs[axis] = [];
                }
                if (indicator.groupFlag) {
                    tempReInConfs[axis].push(indicator);
                } else {
                    var index = parseInt(indicator.indicatorType.substr(1)) - 1;
                    var temp = tempReInConfs[axis][index] || [];
                    temp.push(indicator);
                    tempReInConfs[axis][index] = temp;
                }
            }
            if (indicator.indicatorType === 'z') {
                if (!tempReInConfs['z']) {
                    tempReInConfs['z'] = indicator;
                } else if (typeof tempReInConfs['z'] === "string") {
                    tempReInConfs['z'] = [tempReInConfs['z']];
                } else {
                    tempReInConfs['z'].push(indicator);
                }
            }
        }
        return tempReInConfs;
    }

    // 5查询出报表里配置好的过滤条件
    function getReportFilters(reportId, selector) {
        /*获取报表过滤条件数据*/
        var reportFilterVue = $.reportGtstar.reportFilterVue;
        var reportFilters = $.reportGtstar.reportConfigsData['filter'];
        if (reportFilters) {
            resetReportFilter(reportFilters, reportId);
        }
        if (reportFilters === undefined) {
            var filterUrl = $.reportUtil.handleProp(defaultSettings.filterUrl, reportId);
            console.log(filterUrl);

            var param = {
                url: filterUrl,
                methed: "GET",
                data: null,
                async: false,
                contentType: null,
                callback: function callback(datas) {
                    $.reportGtstar.reportConfigsData['filter'] = datas;
                    console.log(datas);
                    resetReportFilter(datas, reportId);
                }
            };
            common.sendAjax(param);
        }
    }

    // 6处理查询出来配置好的过滤条件
    function resetReportFilter(reportFilters, reportId) {
        var selector = $.reportGtstar.options['filterSelector'];
        var reportFilterVue = $.reportGtstar.reportFilterVue;
        if (reportFilterVue) {
            reportFilterVue.searchInput = reportFilters.length > 0 ? filterValue(reportFilters) : [];
            reportFilterVue.report = { id: reportId };
        } else {
            $.reportGtstar.reportFilterVue = new Vue({
                el: selector,
                data: {
                    searchInput: reportFilters.length > 0 ? filterValue(reportFilters) : [],
                    report: { id: reportId }
                },
                mounted: function mounted() {
                    this.initSelectMul();
                },

                methods: {
                    initSelectMul: function initSelectMul() {

                        $('.selectInit').multiselect({
                            maxHeight: 200,
                            numberDisplayed: 1,
                            optionClass: function optionClass(element) {
                                var value = $(element).parent().find($(element)).index();
                                if (value % 2 == 0) {
                                    return 'even';
                                } else {
                                    return 'odd';
                                }
                            },
                            nonSelectedText: '请选择', // 未选中时select框提示
                            nSelectedText: '个值选中了', // 未选中时select框提示
                            allSelectedText: '全选', // 全选时 select框提示
                            selectAllText: '全选', //option中全选文本
                            includeSelectAllOption: true,
                            selectAllJustVisible: true
                        });
                    }
                }
            });
        }
        reportFilters.length > 0 ? $(selector).show() : $(selector).hide();
    }

    /**
     * 8根据报表ID获得相关数据，并调用回调函数
     * @param  {[type]}   reportId [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    function getDatas(reportId, callback) {

        $.reportGtstar.searchMap();

        if (!$.reportGtstar.reportType) {
            var defaultReportType = vm.reportType;
            console.log(defaultReportType);
            $.reportGtstar.reportType = defaultReportType;
            $.reportGtstar.exportType = defaultReportType;
        }
        if (!$.reportGtstar.reportTime) {
            var nowDate = new Date();
            var year = nowDate.getFullYear();
            var month = nowDate.getMonth();

            month = month < 10 ? '0' + month : month;
            var reportTime = year + "" + month;
            $.reportGtstar.reportTime = reportTime;
            $.reportGtstar.exportTime = reportTime;

            $(":input[name='reportTime']").attr("value", reportTime);
        }
        var params = {
            reportType: $.reportGtstar.reportType,
            reportTime: $.reportGtstar.reportTime,
            filterMap: $.reportGtstar.filterMap
        };
        // debugger
        var dataUrl = $.reportUtil.handleProp(defaultSettings.dataUrl, reportId);

        var param = {
            url: dataUrl,
            methed: "POST",
            data: JSON.stringify(params),
            contentType: null,
            beforeSend: function beforeSend() {
                $("#loadingWrap").show();
            },
            callback: callback,
            complete: function complete() {}
        };
        common.sendAjax(param);
    }

    function getHeaderConf(settings) {
        return settings;
    }

    // 9通过 yKey, allY 对查询出的每条数据temp 确定tableData数据中的下标index，
    function getIndexData(yKey, allY, temp, allData) {
        var keyVal = allY[yKey];
        if (keyVal) {
            var data = void 0;
            var yIndex = keyVal.indexOf(temp[yKey]);
            if (yIndex == -1) {
                yIndex = keyVal.length;
                keyVal.push(temp[yKey]);
                data = allData[yIndex] = {};
                data[yKey] = temp[yKey];
            } else {
                data = allData[yIndex];
            }
            return data;
        } else {
            var key1 = Object.keys(allY)[0];
            var key2 = yKey.substr(key1.length);
            var index = 0;
            outer: for (var i in allY[key1]) {
                var allYTemp = allY[key1][i];
                if (i != temp[key1]) {
                    index += allYTemp.length;
                } else {
                    for (var j in allY[key1][i]) {
                        var val = allY[key1][i][j];
                        if (val != temp[key2]) {
                            index += 1;
                        } else {
                            break outer;
                        }
                    }
                }
            }

            var _data = allData[index];
            if (!_data) {
                _data = allData[index] = {};
                _data[key1] = temp[key1];
                _data[key2] = temp[key2];
                _data[yKey] = $.reportGtstar.splitJoint(temp[key1], temp[key2]);
            }
            return _data;
        }
    }

    function getDefaultBarOrLineOptions(viewType, chartData, settings) {
        var reportCinfig = $.reportGtstar.reportConfigsData;
        var chartTitle = reportCinfig.reportAlias || reportCinfig.reportName;
        var options = {
            chart: {
                type: viewType
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: chartData.xAxis,
                tickmarkPlacement: 'on'
            },
            yAxis: {
                title: {
                    text: ''
                },
                labels: {}
            },
            exporting: {
                enabled: true,
                printButton: {//配置打印按钮

                },
                exportButton: {//配置导出按钮

                },
                filename: chartTitle, //下载显示的文件名称
                sourceWidth: 1000, //下载图片的宽度
                sourceHeight: 550 //下载图片的高度
            },
            credits: {
                enabled: false //设置false就不会显示右下角的官网链接
            },
            series: chartData.datas
        };

        var colors = reportCinfig['chartColors'];
        if (colors) {
            options['colors'] = colors.split(',');
        }
        if (settings) {
            return $.extend(true, options, settings);
        }
        return $.extend(true, options);
    }

    $.extend($.reportGtstar, {
        valueSeparator: '_',
        filterTrue: false, //当前报表是否筛选过
        currentData: { // 当前报表 表格页面显示数据的 信息，图的参数来源于该变量。
            'rowHeader_': [], // 当前页面显示表格的表头列表（随筛选变动）
            'colHeader_': [], // 当前页面显示表格的列头列表（随筛选变动）
            'tableDatas': [], // 当前页面显示表格的表数据（随筛选变动）
            rowlevel: 1, // 表头层数
            collevel: 1, // 列头层数
            yKey: { yKey: '', show: '' }, // 列头对应数据中的key
            y1: "",
            reportId: 0, // 当前显示的报表ID
            xAxisName: [], // 图形的x轴列表（随筛选变动）
            seriesName: [] // 图形的legend列表（随筛选变动）
        },
        currentBackUpData: {}, // 数据结构同currentData，当前报表 全部数据的信息，
        // 第一次加载出来是设置，筛选条件从该变量得到。不随筛选变动

        /**
         * 该变量用于存储所有报表的配置项信息，类似于缓冲池。
         * key = reportId， value{object} = 报表对应的配置项。
         * value:{
        *  ['reportName'] : string : 报表名称
        *  ['viewType'] : number : 报表展示类型，0：图表,1：图,2：表格',
        *  ['defaultCharts'] : string : 报表默认显示图，'bar','pie','line'
        *  ['enableFlag'] : number : 当前配置是否可用
        *  ['chartColors'] : string : 报表图形的颜色,多个值之间用逗号分隔
        *  ['exportFormat'] : string : 支持导出的格式类型
        *  ['reportAlias'] : string : 报表别名
        *  ['fontFamily'] : string : 字体设置, 多个值之间用逗号分隔
        *  ['rowLevel'] : number : 表头层数
        *  ['colLevel'] : number : 列头层数
        *  ['reportIndicatorConfig'] : object : 报表指标配置信息{
        *        ['indicatorName'] : string : 指标对应数据中的key
        *        ['indicatorAlias'] : string : 指标显示在页面上的名字
        *        ['indicatorType'] : string : 指标类型x[1|2], y[1|2], z
        *        ['groupFlag'] : number : 数据是否按指标进行group去重显示
        *  };
        * }
         */
        reportConfigsData: {},

        /**
         * 该方法用于在后台根据reportId获得报表的全局报表配置信息，
         * 将报表配置信息 通过 resetConfig 方法转变一下数据格式。
         * 并将该信息通过 settings 中的 initReport 方法渲染成页面的报表。
         * @param  {object} settings [各键值对参考 defaultSettings]
         * @return {[type]}          [description]
         */
        initReportConfigs: function initReportConfigs(settings) {
            if (!settings) {
                settings = {};
            }
            this.options = defaultSettings = $.extend(defaultSettings, settings);
            console.log($.reportGtstar.currentData.reportId);
            // debugger
            getReports(function (datas) {
                var configs = $.reportGtstar.resetConfig(datas);
                $.reportGtstar.options["initReport"](configs);
            });
        },
        /**
         * 将initReportConfigs 根据reportId查询出来的报表配置信息 转换格式，并存储到全局变量reportConfigsData中
         * @param  {array[object]} reportConfig          [报表全局配置信息列表]
         * @param  {array[object]} reportIndicatorConfig [报表指标配置信息列表]
         * @return {object{key,value}}                   [转换格式后的报表配置信息]
         *          key: reportId,
         *          value: 转换格式后的报表配置信息
         *
         */
        resetConfig: function resetConfig(reportConfig) {
            console.log('读取reportConfig后的配置数据是：---aaaa--');
            console.log(reportConfig);
            this.reportConfigsData = reportConfig;
            return this.reportConfigsData;
        },
        /**
         * 根据reportID生成页面表格
         * @param  {number} reportId [报表ID]
         * @return {[type]}          [description]
         */
        getReport: function getReport(reportId) {
            // 根据ID获得报表配置信息，包括全局配置信息和指标配置信息
            getReportConfigs(reportId, function (reportConf) {
                // 根据ID获得报表过滤信息
                getReportFilters(reportId, $.reportGtstar.options['filterSelector']);
                // 根据ID获得报表需要显示的数据
                getDatas(reportId, function (reportDatas) {
                    // console.log(reportDatas );
                    var header_ = [],
                        colHeader_ = [],
                        xAxisName = [],
                        seriesName = [];
                    var templevel = 0,
                        reportName = reportConf.reportName,
                        reportAlias = reportConf.reportAlias,
                        totalLevel = reportConf.rowLevel,
                        totalColLevel = reportConf.colLevel;
                    var tempReInConfs = getTempConfsObj(reportConf.reportIndicatorConfig);

                    // y配置解析
                    var yKey = { yKey: '', show: '' };
                    var allY = {},
                        y1 = void 0;
                    var allData = [];

                    // 解析数据
                    $.reportGtstar.currentData = {
                        'rowHeader_': header_,
                        'colHeader_': colHeader_,
                        'tableDatas': allData,
                        rowlevel: totalLevel,
                        collevel: totalColLevel,
                        yKey: yKey,
                        y1: y1,
                        reportId: reportId,
                        reportName: reportName,
                        reportAlias: reportAlias,
                        selectRowIndex: [],
                        chartType: "",
                        isShow: true,
                        xAxisName: xAxisName,
                        seriesName: seriesName
                    };

                    $.reportGtstar.currentBackUpData = {
                        'rowHeader_': header_,
                        'colHeader_': colHeader_,
                        'tableDatas': allData,
                        rowlevel: totalLevel,
                        collevel: totalColLevel,
                        yKey: yKey,
                        y1: y1,
                        reportId: reportId,
                        xAxisName: xAxisName,
                        seriesName: seriesName
                    };

                    if (!reportDatas || reportDatas.length == 0) {
                        $("#loadingWrap").hide();
                        setTimeout(function () {
                            alert("报表无数据！");
                        });
                        $.reportGtstar.currentData.isShow = false;
                        // return;
                    }

                    if (tempReInConfs['y'].length == 2) {
                        var yConfs1 = tempReInConfs['y'][0];
                        allY[tempReInConfs['y'][0]['indicatorName']] = {};
                        var yConfs2 = tempReInConfs['y'][1];
                        y1 = yConfs1['indicatorName'];
                        yKey['show'] = yConfs1['indicatorAlias'] + '-' + yConfs2['indicatorAlias'];
                        yKey['yKey'] = yConfs1['indicatorName'] + yConfs2['indicatorName'];

                        var level1Keys = [],
                            level1GroupDatas = {};
                        for (var i = 0, len = reportDatas.length; i < len; i++) {
                            var dataTemp = reportDatas[i];
                            var valTemp = dataTemp[yConfs1['indicatorName']];
                            var level1KeyIndex = level1Keys.indexOf(valTemp);
                            if (level1KeyIndex === -1) {
                                level1KeyIndex = level1Keys.length;
                                level1Keys.push(valTemp);
                                allY[yConfs1['indicatorName']][valTemp] = [];

                                var treeCode = "0" + (Array(4).join('0') + level1KeyIndex).substr(-4);
                                level1GroupDatas[valTemp] = { id: dataTemp.id, treeCode: treeCode, datas: [] };
                                colHeader_.push({
                                    "isleaf": 'N',
                                    "level": 1,
                                    "name": valTemp,
                                    "treeCode": treeCode,
                                    "width": yConfs1['width']
                                });
                            }
                            level1GroupDatas[valTemp]['datas'].push(dataTemp);
                        }

                        for (var groupDatasKey in level1GroupDatas) {
                            var groupDatas = level1GroupDatas[groupDatasKey];
                            var level2Keys = [];
                            for (var _i = 0, _len = groupDatas['datas'].length; _i < _len; _i++) {
                                var temp = groupDatas['datas'][_i];
                                var _valTemp = temp[yConfs2['indicatorName']];
                                var level2KeyIndex = level2Keys.indexOf(_valTemp);
                                if (level2KeyIndex === -1) {
                                    level2KeyIndex = level2Keys.length;
                                    level2Keys.push(_valTemp);
                                    allY[yConfs1['indicatorName']][groupDatasKey].push(_valTemp);

                                    colHeader_.push({
                                        "isleaf": 'Y',
                                        "level": 2,
                                        "columnValue": $.reportGtstar.splitJoint(groupDatasKey, _valTemp),
                                        "name": _valTemp,
                                        "treeCode": groupDatas['treeCode'] + (Array(4).join('0') + level2KeyIndex).substr(-4),
                                        "width": yConfs2['width']
                                    });

                                    xAxisName.push({
                                        name: $.reportGtstar.contactAxisName(groupDatasKey, _valTemp),
                                        value: $.reportGtstar.splitJoint(groupDatasKey, _valTemp)
                                    });
                                }
                            }
                        }
                        // console.log(colHeader_);
                    }

                    if (tempReInConfs['y'].length == 1) {
                        var yConfs = tempReInConfs['y'][0];
                        yKey['show'] = yConfs['indicatorAlias'];
                        yKey['yKey'] = yConfs['indicatorName'];
                        allY[yKey['yKey']] = [];
                        var allY1 = [];
                        for (var _i2 = 0, _len2 = reportDatas.length; _i2 < _len2; _i2++) {
                            var _dataTemp = reportDatas[_i2];
                            var _valTemp2 = _dataTemp[yConfs['indicatorName']];
                            var index = allY1.indexOf(_valTemp2);
                            if (index === -1) {
                                index = allY1.length;
                                allY1.push(_valTemp2);
                                var _treeCode = "0" + (Array(4).join('0') + index).substr(-4);
                                colHeader_.push({
                                    "isleaf": 'Y',
                                    "level": 1,
                                    "columnValue": _valTemp2,
                                    "name": _valTemp2,
                                    "treeCode": _treeCode,
                                    "width": yConfs['width']
                                });
                                xAxisName.push({ name: _valTemp2, value: _valTemp2 });
                            }
                        }
                    }

                    $.reportGtstar.currentData.y1 = $.reportGtstar.currentBackUpData.y1 = y1;

                    // x配置解析
                    var xKey = [];
                    for (var _i3 in tempReInConfs['x']) {
                        var levelXConfs = tempReInConfs['x'][_i3];
                        templevel++;
                        if ($.type(levelXConfs) !== "array") {
                            var xKeyTemp = { name: levelXConfs.indicatorName, keyArray: [] };
                            if (tempReInConfs['z'] && _i3 == tempReInConfs['x'].length - 1) {
                                xKeyTemp['value'] = tempReInConfs['z']['indicatorName'];
                            }
                            xKey.push(xKeyTemp);
                        } else {
                            if (!xKey[_i3]) {
                                xKey[_i3] = [];
                            }

                            for (var j = 0, jLen = levelXConfs.length; j < jLen; j++) {
                                var xConf = levelXConfs[j];
                                xKey[_i3].push({
                                    name: xConf.indicatorName,
                                    index: j,
                                    treeCode: "1" + j,
                                    id: xConf.id,
                                    showName: xConf.indicatorAlias
                                });

                                header_.push(getHeaderConf({
                                    "id": xConf.id,
                                    "isleaf": templevel == totalLevel ? 'Y' : 'N',
                                    "level": _i3 + 1,
                                    "name": xConf.indicatorAlias,
                                    "pid": '',
                                    "reportColumnName": templevel == totalLevel ? xConf.indicatorName : "",
                                    "treeCode": "1" + j
                                }));
                            }
                        }
                    }

                    if (xKey.length == 2) {
                        var level1Confs = xKey[0];
                        var level2Confs = xKey[1];

                        // 4. [{keyArray:[],name:'p'},{keyArray:[],name:'c',value:'v'}]
                        if ($.type(level1Confs) === 'object') {
                            var _level1Keys = [];
                            var _level1GroupDatas = {};
                            for (var _i4 = 0, _len3 = reportDatas.length; _i4 < _len3; _i4++) {
                                var _dataTemp2 = reportDatas[_i4];
                                var _valTemp3 = _dataTemp2[level1Confs['name']];

                                var _level1KeyIndex = _level1Keys.indexOf(_valTemp3);
                                if (_level1KeyIndex === -1) {
                                    _level1KeyIndex = _level1Keys.length;
                                    _level1Keys.push(_valTemp3);

                                    var _treeCode2 = "1" + (Array(4).join('0') + _level1KeyIndex).substr(-4);
                                    _level1GroupDatas[_valTemp3] = { id: _dataTemp2.id, treeCode: _treeCode2, datas: [] };

                                    header_.push(getHeaderConf({
                                        "id": _dataTemp2.id,
                                        "isleaf": 'N',
                                        "level": 1,
                                        "name": _valTemp3,
                                        "pid": 0,
                                        "reportColumnName": "",
                                        "treeCode": "1" + (Array(4).join('0') + _level1KeyIndex).substr(-4)
                                    }));
                                }
                                _level1GroupDatas[_valTemp3]['datas'].push(_dataTemp2);
                            }

                            if ($.type(level2Confs) === 'object') {
                                for (var _groupDatasKey in _level1GroupDatas) {
                                    var _groupDatas = _level1GroupDatas[_groupDatasKey];
                                    var _level2Keys = [];

                                    for (var _i5 in _groupDatas['datas']) {
                                        var _temp = _groupDatas['datas'][_i5];
                                        var _valTemp4 = _temp[level2Confs['name']];
                                        var _level2KeyIndex = _level2Keys.indexOf(_valTemp4);
                                        if (_level2KeyIndex === -1) {
                                            _level2KeyIndex = _level2Keys.length;
                                            _level2Keys.push(_valTemp4);

                                            header_.push(getHeaderConf({
                                                "id": _groupDatas['id'] + _level2KeyIndex,
                                                "isleaf": 'Y',
                                                "level": 2,
                                                "name": _valTemp4,
                                                "pid": _groupDatas['id'],
                                                "reportColumnName": level1Confs['name'] + _groupDatasKey + level2Confs['name'] + _level2KeyIndex,
                                                "treeCode": _groupDatas['treeCode'] + (Array(4).join('0') + _level2KeyIndex).substr(-4),
                                                parentTreeCode: _groupDatas['treeCode']
                                            }));
                                            seriesName.push({
                                                name: $.reportGtstar.contactAxisName(_groupDatasKey, _valTemp4),
                                                value: level1Confs['name'] + _groupDatasKey + level2Confs['name'] + _level2KeyIndex
                                            });
                                        }

                                        var data = getIndexData(yKey['yKey'], allY, _temp, allData);

                                        data[level1Confs['name'] + _groupDatasKey + level2Confs['name'] + _level2KeyIndex] = _temp[level2Confs['value']];
                                    }
                                }
                            } else {}
                        } else {
                            // 3. [[{index:0,name:export,treeCode:"10",id:''},{index:1,name:export,treeCode:"11",id:''}],{keyArray:[],name:'port'}]
                            var _level1Confs = xKey[0];
                            var _level2Confs = xKey[1];
                            if ($.type(_level2Confs) === 'object') {
                                var _level2Keys2 = [];

                                for (var _i6 = 0, _len4 = reportDatas.length; _i6 < _len4; _i6++) {
                                    var _dataTemp3 = reportDatas[_i6];
                                    var _data2 = getIndexData(yKey['yKey'], allY, _dataTemp3, allData);
                                    var _valTemp5 = _dataTemp3[_level2Confs['name']];

                                    var _level2KeyIndex2 = _level2Keys2.indexOf(_valTemp5);
                                    if (_level2KeyIndex2 === -1) {
                                        _level2KeyIndex2 = _level2Keys2.length;
                                        _level2Keys2.push(_valTemp5);

                                        for (var kIndex = 0, levelLen = _level1Confs.length; kIndex < levelLen; kIndex++) {
                                            var level1Conf = _level1Confs[kIndex];
                                            var _treeCode3 = level1Conf['treeCode'] + (Array(4).join('0') + _level2KeyIndex2).substr(-4);

                                            header_.push(getHeaderConf({
                                                "id": _dataTemp3.id,
                                                "isleaf": 'Y',
                                                "level": 2,
                                                "name": _valTemp5,
                                                "pid": level1Conf['id'],
                                                "reportColumnName": level1Conf['name'] + _level2KeyIndex2,
                                                "treeCode": _treeCode3,
                                                "parentTreeCode": level1Conf['treeCode']
                                            }));
                                            seriesName.push({
                                                name: $.reportGtstar.contactAxisName(level1Conf['showName'], _valTemp5),
                                                value: level1Conf['name'] + _level2KeyIndex2
                                            });
                                        }
                                    }
                                    for (var _kIndex = 0, _levelLen = _level1Confs.length; _kIndex < _levelLen; _kIndex++) {
                                        var _level1Conf = _level1Confs[_kIndex];
                                        _data2[_level1Conf['name'] + _level2KeyIndex2] = _dataTemp3[_level1Conf['name']];
                                    }
                                }
                            } else {}
                        }
                    }
                    console.time();
                    if (xKey.length == 1) {
                        var keyArray = [];
                        for (var _i7 = 0, _len5 = reportDatas.length; _i7 < _len5; _i7++) {
                            var _temp2 = reportDatas[_i7];
                            var _data3 = getIndexData(yKey['yKey'], allY, _temp2, allData);

                            for (var _j = 0, xLen = xKey.length; _j < xLen; _j++) {
                                if ($.type(xKey[_j]) === 'array') {
                                    // var xKey = [[{name:'export',index:0},{name:'totalImport',index:1}]];
                                    for (var z = 0, zLen = xKey[_j].length; z < zLen; z++) {
                                        var obj = xKey[_j][z];
                                        _data3[obj['name']] = _temp2[obj['name']];
                                        var objIndex = keyArray.indexOf(obj['name']);
                                        if (objIndex === -1) {
                                            keyArray.push(obj['name']);
                                            seriesName.push({ name: obj['showName'], value: obj['name'] });
                                        }
                                    }
                                } else {
                                    // var xKey = [{name:port, keyArray:[], value:export}]
                                    var _obj = xKey[_j];
                                    var _objIndex = _obj['keyArray'].indexOf(_temp2[_obj['name']]);
                                    if (_objIndex == -1) {
                                        _objIndex = _obj['keyArray'].length;
                                        _obj['keyArray'].push(_temp2[_obj['name']]);
                                        header_.push(getHeaderConf({
                                            "id": _objIndex,
                                            "isleaf": parseInt(_j) + 1 == totalLevel ? 'Y' : 'N',
                                            "level": parseInt(_j) + 1,
                                            "name": _temp2[_obj['name']],
                                            "pid": 0,
                                            "reportColumnName": parseInt(_j) + 1 == totalLevel ? _obj['name'] + _objIndex : "",
                                            "treeCode": "1" + _objIndex
                                        }));
                                        seriesName.push({
                                            name: _temp2[_obj['name']],
                                            value: parseInt(_j) + 1 == totalLevel ? _obj['name'] + _objIndex : ""
                                        });
                                    }
                                    _data3[_obj['name'] + _objIndex] = _temp2[_obj['value']];
                                }
                            }
                        }
                    }
                    console.timeEnd();
                    var table = $.reportGtstar.initTable();
                    if (table) {
                        $.reportGtstar.currentData['tableDatas'] = table['resultData'];
                    }
                });
            });
        },
        //复制表头thead，实现固定表头
        cloneTableHead: function cloneTableHead() {
            $("#theadDiv").empty();
            var tableHead = $("#example_autohead_thead").clone(true).attr("id", "cloneHead");
            $("#theadDiv").html(tableHead);
        },
        resetExportTableHead: function resetExportTableHead() {
            var firstTr = $("#example_autohead_thead tr:nth-child(1)");

            var colspanNum = $("#example_autohead_tbody tr:nth-child(1) td").length;

            var exportHeadData = {
                title: $.reportGtstar.exportTitle,
                type: reportAllType[$.reportGtstar.exportType],
                time: $.reportGtstar.exportTime
            };

            var exportHtml = '<tr class="none" >\n                                 <th colspan=' + colspanNum + '><h3>' + exportHeadData.title + '</h3></th>\n                             </tr>\n                             <tr class="none" >\n                                 <th colspan=' + colspanNum + '><span>\u62A5\u8868\u7C7B\u578B:' + exportHeadData.type + '</span></th>\n                             </tr>\n                             <tr class="none">\n                                <th colspan=' + colspanNum + '><span>\u62A5\u8868\u5468\u671F:' + exportHeadData.time + '</span></th>\n                            </tr>';
            firstTr.before(exportHtml);
            // console.log(exportHeadData)
        },
        splitJoint: function splitJoint() {
            return Array.prototype.join.call(arguments, this.valueSeparator);
        },
        contactAxisName: function contactAxisName(parentName, childName) {
            return parentName + "-" + childName;
        },
        initTable: function initTable() {
            var tableData = $.reportGtstar.currentBackUpData.xAxisName;

            var theTable = $.fn.autoHeader.init({
                laynum: this.currentData.rowlevel,
                colLaynum: this.currentData.collevel,
                headJson: this.currentData.rowHeader_,
                colHeadJson: this.currentData.colHeader_,
                dataJson: $.reportGtstar.currentBackUpData.tableDatas,
                tableid: $.reportGtstar.options['tableId'],
                needsort: true,
                yKey: this.currentData.yKey
            });

            var headHeight = $("#example_autohead_thead").height();
            $("div.content_left").scrollTop(1);
            var scorllVal = $("div.content_left").scrollTop();
            console.log(scorllVal);

            if (scorllVal > 0) {
                $.reportGtstar.cloneTableHead();
                $("#theadDiv.fixedHead").css("height", headHeight + "px");
                $.reportGtstar.setTableHeadWidth();
            } else {
                $("#theadDiv.fixedHead").css("height", "0");
            }

            //监听表格中的滚动条,实现表头和表格同时横向滚动
            $("div.content_left").scroll(function (e) {
                var offsetLeft = $("div.content_left").scrollLeft();
                $(".fixedHead").scrollLeft(offsetLeft);
            });

            $.reportGtstar.currentData['tableDatas'] = theTable['resultData'];

            $.reportGtstar.resetExportTableHead();

            this.initView();

            var viewType = $.reportGtstar.reportConfigsData["viewType"];
            if (viewType == "2") {
                setTimeout(function () {
                    $("#loadingWrap").hide();
                }, 1000);
            }

            return theTable;
        },
        // 根据表格内容动态设置表头宽度，即是将thead内各个th的宽度赋值给固定表头cloneHead
        setTableHeadWidth: function setTableHeadWidth() {
            var theadOneRowTh = $("#example_autohead_thead tr:nth-child(1) th");
            var theadTwoRowTh = $("#example_autohead_thead tr:nth-child(2) th");
            var cloneHeadOneRowTh = $("#cloneHead tr:nth-child(1) th");
            var cloneHeadTwoRowTh = $("#cloneHead tr:nth-child(2) th");
            var rowLevel = $.reportGtstar.currentData.rowlevel;
            var thead = $("#example_autohead_thead");
            var clonethead = $("#cloneHead");
            var theadWidth = thead.width();
            // 获取浏览器的类型
            var BrowserType = $.reportGtstar.browserType();
            if (BrowserType == "Chrome") {
                clonethead.width(parseInt(theadWidth, 10));
            } else {
                clonethead.width(theadWidth + 1);
            }

            // 设置表头第二个tr内th的宽度
            if (rowLevel == 1) {
                // 设置表头第一个tr内th的宽度
                for (var i = 0; i < theadOneRowTh.length; i++) {
                    var widthTd = theadOneRowTh.eq(i).width();
                    if (BrowserType == "Chrome") {
                        cloneHeadOneRowTh.eq(i).attr("style", "width:" + (widthTd + 14) + "px");
                    } else {
                        cloneHeadOneRowTh.eq(i).attr("style", "width:" + (widthTd + 13) + "px");
                    }
                }
            } else if (rowLevel == 2) {
                var firstThWidth = theadOneRowTh.eq(0).width();
                if (BrowserType == "Chrome") {
                    cloneHeadOneRowTh.eq(0).attr("width", firstThWidth + 14 + "px");
                    for (var _i8 = 0; _i8 < theadTwoRowTh.length; _i8++) {
                        var _widthTd = theadTwoRowTh.eq(_i8).width();
                        cloneHeadTwoRowTh.eq(_i8).attr("style", "width:" + (_widthTd + 14) + "px");
                    }
                } else {
                    cloneHeadOneRowTh.eq(0).attr("width", firstThWidth + 13 + "px");
                    for (var _i9 = 0; _i9 < theadTwoRowTh.length; _i9++) {
                        var _widthTd2 = theadTwoRowTh.eq(_i9).width();
                        cloneHeadTwoRowTh.eq(_i9).attr("style", "width:" + (_widthTd2 + 13) + "px");
                    }
                }
            }
        },
        browserType: function browserType() {
            //取得浏览器的userAgent字符串
            var userAgent = navigator.userAgent;
            //判断是否Firefox浏览器
            var isFirefox = userAgent.indexOf("Firefox") > -1;
            //判断是否Opera浏览器
            var isOpera = userAgent.indexOf("Opera") > -1;
            //判断是否Safari浏览器
            var isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1;
            //判断Chrome浏览器
            var isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1;

            if (isFirefox) return "Firefox";
            if (isOpera) return "Opera";
            if (isSafari) return "Safari";
            if (isChrome) return "Chrome";
        },
        /**
         * 去掉筛选的影响，重新还原数据
         */
        originalDataInitTable: function originalDataInitTable() {
            this.currentData = $.extend(true, {}, this.currentBackUpData);
            this.initTable();
        },
        //筛选功能的方法
        resetTableRowHeader: function resetTableRowHeader(rowHeaderArray) {
            // 1. 将全部的 rowHeader 放入map中，key为 treeCode
            var backUpRowHeader = this.currentBackUpData['rowHeader_'];
            var rowHeaderMap = {},
                newRowHeader = [];

            for (var i = 0, headLen = backUpRowHeader.length; i < headLen; i++) {
                var temp = backUpRowHeader[i];
                rowHeaderMap[temp['treeCode']] = temp;
            }
            // 2. 遍历选中的rowHeader，不重复的放入到最后的生成的数据中
            var areadyPushArray = [];
            var needShowSeriesNames = [];

            for (var _i10 = 0, len = rowHeaderArray.length; _i10 < len; _i10++) {
                var _temp3 = rowHeaderArray[_i10];
                if (areadyPushArray.indexOf(_temp3) === -1) {
                    newRowHeader.push(rowHeaderMap[_temp3]);
                    areadyPushArray.push(_temp3);
                    needShowSeriesNames.push(rowHeaderMap[_temp3]['reportColumnName']);
                }
            }
            this.currentData['rowHeader_'] = newRowHeader;

            var currentSeriesNames = [],
                seriesNameArr = this.currentBackUpData.seriesName;
            for (var _i11 = 0, seriesLen = seriesNameArr.length; _i11 < seriesLen; _i11++) {
                var _temp4 = seriesNameArr[_i11];
                if (needShowSeriesNames.indexOf(_temp4['value']) != -1) {
                    currentSeriesNames.push(_temp4);
                }
            }
            this.currentData['seriesName'] = currentSeriesNames;
        },
        resetTableColHeader: function resetTableColHeader(colHeaderArray) {
            // 先将所有的columnValue列出来，然后遍历参数中的value，
            // 设置datas， 将datas中的相关数据按 columnValue 的 index设置。
            var backUpColHeader = this.currentBackUpData['colHeader_'];
            var colHeaderMap = {},
                newColHeader = [],
                columnValues = [];
            for (var i = 0, len = backUpColHeader.length; i < len; i++) {
                var temp = backUpColHeader[i];
                colHeaderMap[temp['treeCode']] = temp;
            }
            var areadyPushArray = [];
            var needShowXAsisNames = [];

            for (var _i12 = 0, _len6 = colHeaderArray.length; _i12 < _len6; _i12++) {
                var _temp5 = colHeaderArray[_i12];
                if (areadyPushArray.indexOf(_temp5) === -1) {
                    newColHeader.push(colHeaderMap[_temp5]);
                    var columnValue = colHeaderMap[_temp5]['columnValue'];
                    if (columnValue) {
                        columnValues.push(columnValue);
                    }
                    areadyPushArray.push(_temp5);
                    needShowXAsisNames.push(columnValue);
                }
            }
            this.currentData['colHeader_'] = newColHeader;

            var currentXAxisNames = [],
                xAxisNameArr = this.currentBackUpData.xAxisName;
            for (var _i13 = 0, _len7 = xAxisNameArr.length; _i13 < _len7; _i13++) {
                var _temp6 = xAxisNameArr[_i13];
                if (needShowXAsisNames.indexOf(_temp6['value']) != -1) {
                    currentXAxisNames.push(_temp6);
                }
            }
            this.currentData['xAxisName'] = currentXAxisNames;
            // this.resetDatasByColValues(columnValues);
        },
        resetDatasByColValues: function resetDatasByColValues(columnValues) {
            var backTableDatas = this.currentBackUpData['tableDatas'];
            var newTableDatas = [];
            var validDataCount = 0;
            for (var i = 0, len = backTableDatas.length; i < len; i++) {
                if (validDataCount == columnValues.length) {
                    break;
                }
                var temp = backTableDatas[i];
                var index = columnValues.indexOf(temp[this.currentBackUpData.yKey['yKey']]);
                if (index === -1) {
                    continue;
                }
                newTableDatas[index] = temp;
                validDataCount++;
            }
            this.currentData['tableDatas'] = newTableDatas;
        },
        resetTableHeader: function resetTableHeader(header) {
            this.resetTableRowHeader(header['rowHeader']);
            this.resetTableColHeader(header['colHeader']);
            var table = this.initTable();
        },
        getDaysScope: function getDaysScope(str) {
            var reg = /(\d{4})(\d{2})(\d{2})\s(\d{2})-((\d{4})(\d{2})(\d{2})\s(\d{2}))*/gi;
            var resultArr = reg.exec(str);
            var days = void 0,
                // 相差天数
            endTime = void 0,
                // 结束时间
            startTime = new Date(resultArr[1], resultArr[2] - 1, resultArr[3], resultArr[4]);
            if (resultArr[6] == undefined) {
                endTime = new Date();
            } else {
                endTime = new Date(resultArr[6], resultArr[7] - 1, resultArr[8], resultArr[9]);
            }
            var scopeVal = endTime.getTime() - startTime.getTime();
            if (scopeVal < 0) {
                alert("时间输入有误，请重新输入");
            } else {
                days = Math.floor(scopeVal / (24 * 3600 * 1000)); //计算出相差天数
            }
            return days;
        },
        //添加饼状图表头的select框
        getSelectColumnHtml: function getSelectColumnHtml(shuxing) {
            var selectHtml = "";
            selectHtml += '<select class="selectRowName"><option disabled value="">\u8BF7\u9009\u62E9\u4E00\u4E2A\u56FE\u5F62\u5BF9\u6BD4\u6570\u636E\u5B57\u6BB5</option>';

            for (var i = 0; i < shuxing.length; i++) {
                selectHtml += '<option value=\'' + shuxing[i].value + '\'>' + shuxing[i].name + '</option>';
            }
            selectHtml += '</select>';
            return selectHtml;
        },
        initView: function initView() {
            var reportConfig = this.reportConfigsData;
            $.reportGtstar.currentData.chartType = reportConfig.defaultCharts;
            $.reportGtstar.viewChart(reportConfig.defaultCharts);
        },
        viewChart: function viewChart(chartType) {
            console.log(chartType);
            switch (chartType) {
                case 'bar':
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['barSelector']).slideDown();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $('.selectRowName').hide();
                    $.reportGtstar.initColumnChart();
                    break;
                case 'line':
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideDown();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $.reportGtstar.initLineChart();
                    $('.selectRowName').hide();
                    break;
                case 'area':
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideDown();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $.reportGtstar.initAreaChart();
                    $('.selectRowName').hide();
                    break;
                case 'annulus':
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideDown();
                    $.reportGtstar.initCircularPieChart();
                    $('.selectRowName option').eq(1).attr("selected", true);
                    $('.selectRowName').show();
                    break;
                case 'pie':
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideDown('slow');
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $.reportGtstar.resetInitPieChart();
                    $('.selectRowName option').eq(1).attr("selected", true);
                    $('.selectRowName').show();
                    break;
                default:
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $('.selectRowName').hide();
                    break;
            }
            setTimeout(function () {
                $("#loadingWrap").hide();
            }, 1000);
        },

        //生成报表筛选功能按钮的方法
        searchMap: function searchMap() {
            var formData = $('#form_' + $.reportGtstar.currentData.reportId).serialize(); //TODO
            var searchData = {},
                searchKeys = [],
                searchVal = [];
            console.log(formData);
            var filterArr = $.reportGtstar.reportConfigsData.filter;
            formData = decodeURIComponent(formData);
            var formArray = formData.split("&");
            for (var i = 0, len = formArray.length; i < len; i++) {
                var valArr = formArray[i].split("=");
                var inx = searchKeys.indexOf(valArr[0]);
                if (inx == -1) {
                    searchKeys.push(valArr[0]);
                    searchVal.push(valArr[1]);
                } else {
                    searchVal[inx] = searchVal[inx] + "," + valArr[1];
                }
            }
            for (var _i14 = 0, _len8 = searchKeys.length; _i14 < _len8; _i14++) {
                if (searchVal[_i14] && searchVal[_i14].substr(0, 1) == ",") {
                    searchVal[_i14] = searchVal[_i14].substr(1);
                }
                searchData[searchKeys[_i14]] = searchVal[_i14];
            }
            // debugger
            if (filterArr) {
                filterArr.forEach(function (item, i) {
                    if (item.type && item.type == "select_mul") {
                        $.reportGtstar.filterMap[item.field] = "";
                    }
                    if (item.type && item.type == "data_filter") {
                        $.reportGtstar.filterMap[item.field] = item.value;
                        if (item.placeholder && item.placeholder == "true") {
                            if (count == 0) {
                                var itemArr = item.value.split(',');
                                $('select[name=' + item.field + '] option').each(function (i, content) {
                                    if ($.inArray($.trim(content.value), itemArr) >= 0) {
                                        this.selected = true;
                                    }
                                });
                                //设置选中值后，需要刷新select控件
                                $('select[name=' + item.field + ']').multiselect('refresh');
                                count++;
                            }
                        }
                    }
                });
            }

            var keys = Object.keys(searchData);

            for (var _i15 in keys) {
                var key = keys[_i15];
                if (key.endsWith("1")) {
                    var temp = key.substr(0, key.length - 1);
                    if ($.type($.reportGtstar.filterMap[temp]) === "array") {

                        $.reportGtstar.filterMap[temp][0] = searchData[key];
                    } else {
                        $.reportGtstar.filterMap[temp + ""] = [searchData[key]];
                    }
                } else if (key.endsWith("2")) {
                    var _temp7 = key.substr(0, key.length - 1);
                    if ($.type($.reportGtstar.filterMap[_temp7]) === "array") {
                        $.reportGtstar.filterMap[_temp7][1] = searchData[key];
                    } else {
                        $.reportGtstar.filterMap[_temp7 + ""] = ["", searchData[key]];
                    }
                } else {
                    $.reportGtstar.filterMap[key + ""] = searchData[key];
                }
            }
        },
        initAllChartData: function initAllChartData() {
            var gtCharts = this.currentData;
            var defaultChartData = [],
                xAxis = [],
                defaultChartDataLength = 20; // 默认设置当只有一个y时，图形展示表格中前20条数据

            var chartData = this.currentData.tableDatas,
                xAxisNames = this.currentData.xAxisName,
                selectRowIndex = this.currentData.selectRowIndex,
                seriesNames = this.currentData.seriesName;

            //去除所有选中行的样式
            $("#example_autohead_tbody tr").removeClass("select");
            var y1 = gtCharts.y1,

            // kArray为存储表格上所有被选中行的下标值数组
            kArray = [];
            //当selectRowIndex数组的长度为零时，即为初始默认状态
            if (selectRowIndex && selectRowIndex.length == 0) {
                // 当表格中有两个y时 图形展示表格中以y1分组的第一个y2的所有数据 ；
                // 即第一个网元id中所有的网元
                if (gtCharts.collevel == "2") {
                    for (var k in chartData) {
                        if (chartData[0][y1] == chartData[k][y1]) {
                            // 得到默认选中第一个网元每行的下标数组
                            kArray.push(parseInt(k));
                        }
                    }
                } else {
                    var dataLen = chartData.length;
                    dataLen = dataLen > defaultChartDataLength ? defaultChartDataLength : dataLen;
                    for (var i = 0; i < dataLen; i++) {
                        kArray.push(i);
                    }
                }
            } else {
                kArray = selectRowIndex;
            }

            for (var key = 0, kLen = kArray.length; key < kLen; key++) {
                var selectItem = kArray[key];
                var _i16 = parseInt(selectItem, 10);
                // 给表格上所有的选中行添加select样式
                $("#example_autohead_tbody tr").eq(_i16).addClass("select");
                var itemData = chartData[selectItem];
                defaultChartData.push(itemData);
                var itemxAxis = xAxisNames[selectItem];
                xAxis.push(itemxAxis);
            }
            return { defaultChartDatas: defaultChartData, xAxis: xAxis, seriesNames: seriesNames };
        },
        //处理生成图的数据
        initChartData: function initChartData() {
            var allChartData = this.initAllChartData();
            // console.log(allChartData);
            var chartDataArray = allChartData.defaultChartDatas,
                xAxisArray = allChartData.xAxis,
                seriesNames = allChartData.seriesNames;

            var xAxisShowName = [],
                xAxisShowValue = [];
            for (var i in xAxisArray) {
                var xAxisObj = xAxisArray[i];
                xAxisShowName.push(xAxisObj.name);
                xAxisShowValue.push(xAxisObj.value);
            }

            var datas = [],
                legend = [];
            for (var _i17 = 0, seriesLen = seriesNames.length; _i17 < seriesLen; _i17++) {
                var seriesName = seriesNames[_i17];
                legend.push(seriesName['value']);
                datas.push({ name: seriesName['name'], data: [] });
            }
            for (var _i18 = 0, len = chartDataArray.length; _i18 < len; _i18++) {
                var data = chartDataArray[_i18];
                for (var j = 0, legLen = legend.length; j < legLen; j++) {
                    var legendJ = legend[j];
                    var dataVal = parseFloat(data[legendJ]);
                    if (isNaN(dataVal)) {
                        dataVal = 0;
                    }
                    datas[j]['data'].push(dataVal);
                }
            }
            return { xAxis: xAxisShowName, datas: datas };
        },
        //生成柱状图
        initColumnChart: function initColumnChart() {
            var chartData = this.initChartData();
            var options = {
                tooltip: {},
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                }
            };

            options = getDefaultBarOrLineOptions('column', chartData, options);
            $($.reportGtstar.options['barSelector']).slideDown('slow').highcharts(options);
        },
        //生成折线图
        initLineChart: function initLineChart() {
            var chartData = this.initChartData();
            var options = {
                tooltip: {},
                plotOptions: {
                    line: {
                        dataLabels: {
                            enabled: false
                        }
                    }
                }
            };
            options = getDefaultBarOrLineOptions('line', chartData, options);
            $($.reportGtstar.options['lineSelector']).slideDown('slow').highcharts(options);
        },
        // 生成面积图
        initAreaChart: function initAreaChart() {
            var chartData = this.initChartData();
            var options = {
                tooltip: {},
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        marker: {
                            enabled: false,
                            symbol: 'circle',
                            radius: 2,
                            states: {
                                hover: {
                                    enabled: true
                                }
                            }
                        }
                    }
                }
            };
            options = getDefaultBarOrLineOptions('area', chartData, options);
            $($.reportGtstar.options['areaSelector']).slideDown('slow').highcharts(options);
        },
        //处理生成饼状类图的数据
        initPieChartDatas: function initPieChartDatas(selectValue) {
            var allChartData = this.initAllChartData();
            var chartDataArray = allChartData.defaultChartDatas,
                xAxisArray = allChartData.xAxis,
                seriesNames = allChartData.seriesNames;
            var selectIndex = 0;
            var selectValues = [];
            for (var i = 0, seriesLen = seriesNames.length; i < seriesLen; i++) {
                var seriesName = seriesNames[i];
                selectValues.push(seriesName);
                if (selectValue && !selectIndex && seriesName['value'] === selectValue) {
                    selectIndex = i;
                }
            }
            var pie = seriesNames[selectIndex].name;
            var valueKey = seriesNames[selectIndex].value;
            var yKey = this.currentData.yKey['yKey'];

            var xAxisShowName = [];
            var xAxisShowValue = [];
            for (var _i19 = 0, len = xAxisArray.length; _i19 < len; _i19++) {
                var xAxisName = xAxisArray[_i19];
                xAxisShowName.push(xAxisName['name']);
                xAxisShowValue.push(xAxisName['value']);
            }

            var pieDatas = [];
            for (var _i20 = 0, _len9 = chartDataArray.length; _i20 < _len9; _i20++) {
                var data = chartDataArray[_i20];
                var yValue = data[valueKey];
                if (yValue == undefined) {
                    yValue = 0;
                }
                pieDatas.push({ name: xAxisShowName[xAxisShowValue.indexOf(data[yKey])], y: parseFloat(yValue) });
            }
            $('.selectRowName').remove();
            var selectColumnName = this.getSelectColumnHtml(selectValues);

            return { pieName: pie, pieDatas: pieDatas, selectColumnName: selectColumnName };
        },
        //根据选择的表头字段重新生成饼状图
        resetInitPieChart: function resetInitPieChart(selectValue) {
            var pieChartData = this.initPieChartDatas(selectValue);
            var options = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                title: {
                    text: pieChartData.pieName + '饼状图',
                    widthAdjust: -10
                },
                exporting: {
                    enabled: true,
                    printButton: {//配置打印按钮

                    },
                    exportButton: {//配置导出按钮

                    },
                    filename: pieChartData.pieName + "饼状图", //下载显示的文件名称
                    sourceWidth: 1000, //下载图片的宽度
                    sourceHeight: 550 //下载图片的高度
                },
                credits: {
                    enabled: false //设置false就不会显示右下角的官网链接
                },
                tooltip: {},
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {},
                        showInLegend: true
                    }
                }, series: [{
                    type: 'pie',
                    name: pieChartData.pieName,
                    data: pieChartData.pieDatas
                }]
            };
            $($.reportGtstar.options['pieSelector']).before(pieChartData.selectColumnName).slideDown().highcharts(options);
        },
        //生成环形图
        initCircularPieChart: function initCircularPieChart(selectValue) {
            var pieChartData = this.initPieChartDatas(selectValue);
            var options = {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                title: {
                    text: pieChartData.pieName,
                    verticalAlign: "top",
                    y: 5,
                    widthAdjust: -4,
                    fontFamily: "微软雅黑"
                },
                exporting: {
                    enabled: true,
                    printButton: {//配置打印按钮

                    },
                    exportButton: {//配置导出按钮

                    },
                    filename: pieChartData.pieName + "环形图", //下载显示的文件名称
                    sourceWidth: 1000, //下载图片的宽度
                    sourceHeight: 550 //下载图片的高度
                },
                credits: {
                    enabled: false //设置false就不会显示右下角的官网链接
                },
                tooltip: {},
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {},
                        point: {},
                        showInLegend: true
                    }
                }, series: [{
                    type: 'pie',
                    size: 280,
                    innerSize: '65%',
                    name: pieChartData.pieName,
                    data: pieChartData.pieDatas
                }]
            };

            $($.reportGtstar.options['pieCircular']).before(pieChartData.selectColumnName).slideDown().highcharts(options);
        }
    });
})(jQuery);