/**
 * Created by songfei on 2017/7/13.
 */
(function ($) {
    'use strict';
    $.reportGtstar = $.reportGtstar || {};
    let reportAlreadyConfig = []; //已经配置了指标的报表列表
    let count = 0;
    const baseUrl = common.getbaseUrl();
    console.log(baseUrl);
    let defaultSettings = {
        tableId: '',//
        filterSelector: '',
        barSelector: '', // 柱状图选择器
        pieSelector: '', // 饼状图选择器
        lineSelector: '', // 折线图选择器
        baseUrl: baseUrl,
        nesUrl: baseUrl + "nes/", //网元信息id
        reportUrl: baseUrl + "reportConfigs/",  //获取报表信息的url
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
        let rid = $.reportGtstar.currentData.reportId;
        let param = {
            url: defaultSettings.reportUrl + rid,
            methed: "GET",
            data: null,
            contentType: null,
            callback: successCallBack
        };
        // console.log(param.url)
        return common.sendAjax(param)

    }

    // 请求得到定制neid筛选条件多选框数据
    function getDataFilter(callback) {
        let param = {
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
        let config = $.reportGtstar.reportConfigsData;

        let indicatorConfig = datas
            .filter(item => item.enableFlag != 0)
            .sort(function (item1, item2) {
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
            let configs = $.reportUtil.handleProp(defaultSettings.configUrl, reportId);
            let param = {
                url: configs,
                methed: "GET",
                data: null,
                contentType: null,
                callback: function (data) {
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
        let tempReInConfs = {};
        for (let i in reInConf) {
            let indicator = reInConf[i];
            if (indicator.indicatorType.startsWith("x") || indicator.indicatorType.startsWith("y")) {
                let axis = indicator.indicatorType.substr(0, 1);
                if (!tempReInConfs[axis]) {
                    tempReInConfs[axis] = [];
                }
                if (indicator.groupFlag) {
                    tempReInConfs[axis].push(indicator);
                } else {
                    let index = parseInt(indicator.indicatorType.substr(1)) - 1;
                    let temp = tempReInConfs[axis][index] || [];
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
        let reportFilterVue = $.reportGtstar.reportFilterVue;
        let reportFilters = $.reportGtstar.reportConfigsData['filter'];
        if (reportFilters) {
            resetReportFilter(reportFilters, reportId);
        }
        if (reportFilters === undefined) {
            let filterUrl = $.reportUtil.handleProp(defaultSettings.filterUrl, reportId);
            console.log(filterUrl);

            let param = {
                url: filterUrl,
                methed: "GET",
                data: null,
                async: false,
                contentType: null,
                callback: function (datas) {
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
        let selector = $.reportGtstar.options['filterSelector'];
        let reportFilterVue = $.reportGtstar.reportFilterVue;
        if (reportFilterVue) {
            reportFilterVue.searchInput = reportFilters.length > 0 ? filterValue(reportFilters) : [];
            reportFilterVue.report = {id: reportId};
        } else {
            $.reportGtstar.reportFilterVue = new Vue({
                el: selector,
                data: {
                    searchInput: reportFilters.length > 0 ? filterValue(reportFilters) : [],
                    report: {id: reportId},
                },
                mounted() {
                    this.initSelectMul()
                },
                methods: {
                    initSelectMul: function () {

                        $('.selectInit').multiselect({
                            maxHeight: 200,
                            numberDisplayed: 1,
                            optionClass: function (element) {
                                let value = $(element).parent().find($(element)).index();
                                if (value % 2 == 0) {
                                    return 'even';
                                }
                                else {
                                    return 'odd';
                                }
                            },
                            nonSelectedText: '请选择',   // 未选中时select框提示
                            nSelectedText: '个值选中了', // 未选中时select框提示
                            allSelectedText: '全选',     // 全选时 select框提示
                            selectAllText: '全选',       //option中全选文本
                            includeSelectAllOption: true,
                            selectAllJustVisible: true
                        })

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
            let defaultReportType = vm.reportType;
            console.log(defaultReportType);
            $.reportGtstar.reportType = defaultReportType;
            $.reportGtstar.exportType = defaultReportType;
        }
        if (!$.reportGtstar.reportTime) {
            let nowDate = new Date();
            let year = nowDate.getFullYear();
            let month = nowDate.getMonth();

            month = month < 10 ? '0' + month : month;
            let reportTime = year + "" + month;
            $.reportGtstar.reportTime = reportTime;
            $.reportGtstar.exportTime = reportTime;

            $(":input[name='reportTime']").attr("value", reportTime);
        }
        let params = {
            reportType: $.reportGtstar.reportType,
            reportTime: $.reportGtstar.reportTime,
            filterMap: $.reportGtstar.filterMap
        };
        // debugger
        let dataUrl = $.reportUtil.handleProp(defaultSettings.dataUrl, reportId);

        let param = {
            url: dataUrl,
            methed: "POST",
            data: JSON.stringify(params),
            contentType: null,
            beforeSend: function () {
                $("#loadingWrap").show();
            },
            callback: callback,
            complete: function () {

            }
        };
        common.sendAjax(param);

    }

    function getHeaderConf(settings) {
        return settings;
    }

    // 9通过 yKey, allY 对查询出的每条数据temp 确定tableData数据中的下标index，
    function getIndexData(yKey, allY, temp, allData) {
        let keyVal = allY[yKey];
        if (keyVal) {
            let data;
            let yIndex = keyVal.indexOf(temp[yKey]);
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
            let key1 = Object.keys(allY)[0];
            let key2 = yKey.substr(key1.length);
            let index = 0;
            outer:
                for (let i in allY[key1]) {
                    let allYTemp = allY[key1][i];
                    if (i != temp[key1]) {
                        index += allYTemp.length;
                    } else {
                        for (let j in allY[key1][i]) {
                            let val = allY[key1][i][j];
                            if (val != temp[key2]) {
                                index += 1;
                            } else {
                                break outer;
                            }
                        }
                    }
                }

            let data = allData[index];
            if (!data) {
                data = allData[index] = {};
                data[key1] = temp[key1];
                data[key2] = temp[key2];
                data[yKey] = $.reportGtstar.splitJoint(temp[key1], temp[key2]);
            }
            return data;
        }
    }

    function getDefaultBarOrLineOptions(viewType, chartData, settings) {
        let reportCinfig = $.reportGtstar.reportConfigsData;
        let chartTitle = reportCinfig.reportAlias || reportCinfig.reportName;
        let options = {
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
                printButton: {    //配置打印按钮

                },
                exportButton: {    //配置导出按钮

                },
                filename: chartTitle, //下载显示的文件名称
                sourceWidth: 1000,     //下载图片的宽度
                sourceHeight: 550 //下载图片的高度
            },
            credits: {
                enabled: false //设置false就不会显示右下角的官网链接
            },
            series: chartData.datas
        };

        let colors = reportCinfig['chartColors'];
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
        filterTrue: false,//当前报表是否筛选过
        currentData: { // 当前报表 表格页面显示数据的 信息，图的参数来源于该变量。
            'rowHeader_': [], // 当前页面显示表格的表头列表（随筛选变动）
            'colHeader_': [], // 当前页面显示表格的列头列表（随筛选变动）
            'tableDatas': [], // 当前页面显示表格的表数据（随筛选变动）
            rowlevel: 1, // 表头层数
            collevel: 1, // 列头层数
            yKey: {yKey: '', show: ''}, // 列头对应数据中的key
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
        initReportConfigs: function (settings) {
            if (!settings) {
                settings = {};
            }
            this.options = defaultSettings = $.extend(defaultSettings, settings);
            console.log($.reportGtstar.currentData.reportId)
            // debugger
            getReports(function (datas) {
                let configs = $.reportGtstar.resetConfig(datas);
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
        resetConfig: function (reportConfig) {
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
        getReport: function (reportId) {
            // 根据ID获得报表配置信息，包括全局配置信息和指标配置信息
            getReportConfigs(reportId, function (reportConf) {
                // 根据ID获得报表过滤信息
                getReportFilters(reportId, $.reportGtstar.options['filterSelector']);
                // 根据ID获得报表需要显示的数据
                getDatas(reportId, function (reportDatas) {
                    // console.log(reportDatas );
                    let header_ = [], colHeader_ = [], xAxisName = [], seriesName = [];
                    let templevel = 0,
                        reportName = reportConf.reportName,
                        reportAlias = reportConf.reportAlias,
                        totalLevel = reportConf.rowLevel,
                        totalColLevel = reportConf.colLevel;
                    let tempReInConfs = getTempConfsObj(reportConf.reportIndicatorConfig);

                    // y配置解析
                    let yKey = {yKey: '', show: ''};
                    let allY = {}, y1;
                    let allData = [];

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
                        })
                        $.reportGtstar.currentData.isShow = false;
                        // return;
                    }

                    if (tempReInConfs['y'].length == 2) {
                        let yConfs1 = tempReInConfs['y'][0];
                        allY[tempReInConfs['y'][0]['indicatorName']] = {};
                        let yConfs2 = tempReInConfs['y'][1];
                        y1 = yConfs1['indicatorName'];
                        yKey['show'] = yConfs1['indicatorAlias'] + '-' + yConfs2['indicatorAlias'];
                        yKey['yKey'] = yConfs1['indicatorName'] + yConfs2['indicatorName'];

                        let level1Keys = [], level1GroupDatas = {};
                        for (let i = 0, len = reportDatas.length; i < len; i++) {
                            let dataTemp = reportDatas[i];
                            let valTemp = dataTemp[yConfs1['indicatorName']];
                            let level1KeyIndex = level1Keys.indexOf(valTemp);
                            if (level1KeyIndex === -1) {
                                level1KeyIndex = level1Keys.length;
                                level1Keys.push(valTemp);
                                allY[yConfs1['indicatorName']][valTemp] = [];

                                let treeCode = "0" + ( Array(4).join('0') + level1KeyIndex ).substr(-4);
                                level1GroupDatas[valTemp] = {id: dataTemp.id, treeCode: treeCode, datas: []};
                                colHeader_.push({
                                    "isleaf": 'N',
                                    "level": 1,
                                    "name": valTemp,
                                    "treeCode": treeCode,
                                    "width": yConfs1['width'],
                                });
                            }
                            level1GroupDatas[valTemp]['datas'].push(dataTemp);
                        }

                        for (let groupDatasKey in level1GroupDatas) {
                            let groupDatas = level1GroupDatas[groupDatasKey];
                            let level2Keys = [];
                            for (let i = 0, len = groupDatas['datas'].length; i < len; i++) {
                                let temp = groupDatas['datas'][i];
                                let valTemp = temp[yConfs2['indicatorName']];
                                let level2KeyIndex = level2Keys.indexOf(valTemp);
                                if (level2KeyIndex === -1) {
                                    level2KeyIndex = level2Keys.length;
                                    level2Keys.push(valTemp);
                                    allY[yConfs1['indicatorName']][groupDatasKey].push(valTemp);

                                    colHeader_.push({
                                        "isleaf": 'Y',
                                        "level": 2,
                                        "columnValue": $.reportGtstar.splitJoint(groupDatasKey, valTemp),
                                        "name": valTemp,
                                        "treeCode": groupDatas['treeCode'] + ( Array(4).join('0') + level2KeyIndex ).substr(-4),
                                        "width": yConfs2['width'],
                                    });

                                    xAxisName.push({
                                        name: $.reportGtstar.contactAxisName(groupDatasKey, valTemp),
                                        value: $.reportGtstar.splitJoint(groupDatasKey, valTemp)
                                    });
                                }
                            }
                        }
                        // console.log(colHeader_);
                    }

                    if (tempReInConfs['y'].length == 1) {
                        let yConfs = tempReInConfs['y'][0];
                        yKey['show'] = yConfs['indicatorAlias'];
                        yKey['yKey'] = yConfs['indicatorName'];
                        allY[yKey['yKey']] = [];
                        let allY1 = [];
                        for (let i = 0, len = reportDatas.length; i < len; i++) {
                            let dataTemp = reportDatas[i];
                            let valTemp = dataTemp[yConfs['indicatorName']];
                            let index = allY1.indexOf(valTemp);
                            if (index === -1) {
                                index = allY1.length;
                                allY1.push(valTemp);
                                let treeCode = "0" + ( Array(4).join('0') + index ).substr(-4);
                                colHeader_.push({
                                    "isleaf": 'Y',
                                    "level": 1,
                                    "columnValue": valTemp,
                                    "name": valTemp,
                                    "treeCode": treeCode,
                                    "width": yConfs['width'],
                                });
                                xAxisName.push({name: valTemp, value: valTemp});
                            }
                        }
                    }

                    $.reportGtstar.currentData.y1 = $.reportGtstar.currentBackUpData.y1 = y1;

                    // x配置解析
                    var xKey = [];
                    for (let i in tempReInConfs['x']) {
                        let levelXConfs = tempReInConfs['x'][i];
                        templevel++;
                        if ($.type(levelXConfs) !== "array") {
                            let xKeyTemp = {name: levelXConfs.indicatorName, keyArray: []};
                            if (tempReInConfs['z'] && i == tempReInConfs['x'].length - 1) {
                                xKeyTemp['value'] = tempReInConfs['z']['indicatorName'];
                            }
                            xKey.push(xKeyTemp);

                        } else {
                            if (!xKey[i]) {
                                xKey[i] = [];
                            }

                            for (let j = 0, jLen = levelXConfs.length; j < jLen; j++) {
                                let xConf = levelXConfs[j];
                                xKey[i].push({
                                    name: xConf.indicatorName,
                                    index: j,
                                    treeCode: "1" + j,
                                    id: xConf.id,
                                    showName: xConf.indicatorAlias
                                });

                                header_.push(getHeaderConf({
                                    "id": xConf.id,
                                    "isleaf": templevel == totalLevel ? 'Y' : 'N',
                                    "level": i + 1,
                                    "name": xConf.indicatorAlias,
                                    "pid": '',
                                    "reportColumnName": templevel == totalLevel ? (xConf.indicatorName) : "",
                                    "treeCode": "1" + j,
                                }));
                            }
                        }
                    }

                    if (xKey.length == 2) {
                        let level1Confs = xKey[0];
                        let level2Confs = xKey[1];

                        // 4. [{keyArray:[],name:'p'},{keyArray:[],name:'c',value:'v'}]
                        if ($.type(level1Confs) === 'object') {
                            let level1Keys = [];
                            let level1GroupDatas = {};
                            for (let i = 0, len = reportDatas.length; i < len; i++) {
                                let dataTemp = reportDatas[i];
                                let valTemp = dataTemp[level1Confs['name']];

                                let level1KeyIndex = level1Keys.indexOf(valTemp);
                                if (level1KeyIndex === -1) {
                                    level1KeyIndex = level1Keys.length;
                                    level1Keys.push(valTemp);

                                    let treeCode = "1" + ( Array(4).join('0') + level1KeyIndex ).substr(-4);
                                    level1GroupDatas[valTemp] = {id: dataTemp.id, treeCode: treeCode, datas: []};

                                    header_.push(getHeaderConf({
                                        "id": dataTemp.id,
                                        "isleaf": 'N',
                                        "level": 1,
                                        "name": valTemp,
                                        "pid": 0,
                                        "reportColumnName": "",
                                        "treeCode": "1" + ( Array(4).join('0') + level1KeyIndex ).substr(-4),
                                    }));
                                }
                                level1GroupDatas[valTemp]['datas'].push(dataTemp);
                            }

                            if ($.type(level2Confs) === 'object') {
                                for (let groupDatasKey in level1GroupDatas) {
                                    let groupDatas = level1GroupDatas[groupDatasKey];
                                    let level2Keys = [];

                                    for (let i in groupDatas['datas']) {
                                        let temp = groupDatas['datas'][i];
                                        let valTemp = temp[level2Confs['name']];
                                        let level2KeyIndex = level2Keys.indexOf(valTemp);
                                        if (level2KeyIndex === -1) {
                                            level2KeyIndex = level2Keys.length;
                                            level2Keys.push(valTemp);

                                            header_.push(getHeaderConf({
                                                "id": groupDatas['id'] + level2KeyIndex,
                                                "isleaf": 'Y',
                                                "level": 2,
                                                "name": valTemp,
                                                "pid": groupDatas['id'],
                                                "reportColumnName": level1Confs['name'] + groupDatasKey + level2Confs['name'] + level2KeyIndex,
                                                "treeCode": groupDatas['treeCode'] + ( Array(4).join('0') + level2KeyIndex ).substr(-4),
                                                parentTreeCode: groupDatas['treeCode']
                                            }));
                                            seriesName.push({
                                                name: $.reportGtstar.contactAxisName(groupDatasKey, valTemp),
                                                value: level1Confs['name'] + groupDatasKey + level2Confs['name'] + level2KeyIndex
                                            })
                                        }

                                        let data = getIndexData(yKey['yKey'], allY, temp, allData);

                                        data[level1Confs['name'] + groupDatasKey + level2Confs['name'] + level2KeyIndex] = temp[level2Confs['value']];
                                    }
                                }
                            } else {
                            }
                        } else {
                            // 3. [[{index:0,name:export,treeCode:"10",id:''},{index:1,name:export,treeCode:"11",id:''}],{keyArray:[],name:'port'}]
                            let level1Confs = xKey[0];
                            let level2Confs = xKey[1];
                            if ($.type(level2Confs) === 'object') {
                                let level2Keys = [];

                                for (let i = 0, len = reportDatas.length; i < len; i++) {
                                    let dataTemp = reportDatas[i];
                                    let data = getIndexData(yKey['yKey'], allY, dataTemp, allData);
                                    let valTemp = dataTemp[level2Confs['name']];

                                    let level2KeyIndex = level2Keys.indexOf(valTemp);
                                    if (level2KeyIndex === -1) {
                                        level2KeyIndex = level2Keys.length;
                                        level2Keys.push(valTemp);

                                        for (let kIndex = 0, levelLen = level1Confs.length; kIndex < levelLen; kIndex++) {
                                            let level1Conf = level1Confs[kIndex];
                                            let treeCode = level1Conf['treeCode'] + ( Array(4).join('0') + level2KeyIndex ).substr(-4);

                                            header_.push(getHeaderConf({
                                                "id": dataTemp.id,
                                                "isleaf": 'Y',
                                                "level": 2,
                                                "name": valTemp,
                                                "pid": level1Conf['id'],
                                                "reportColumnName": level1Conf['name'] + level2KeyIndex,
                                                "treeCode": treeCode,
                                                "parentTreeCode": level1Conf['treeCode']
                                            }));
                                            seriesName.push({
                                                name: $.reportGtstar.contactAxisName(level1Conf['showName'], valTemp),
                                                value: level1Conf['name'] + level2KeyIndex
                                            });
                                        }
                                    }
                                    for (let kIndex = 0, levelLen = level1Confs.length; kIndex < levelLen; kIndex++) {
                                        let level1Conf = level1Confs[kIndex];
                                        data[level1Conf['name'] + level2KeyIndex] = dataTemp[level1Conf['name']];
                                    }
                                }

                            } else {

                            }
                        }
                    }
                    console.time()
                    if (xKey.length == 1) {
                        let keyArray = [];
                        for (let i = 0, len = reportDatas.length; i < len; i++) {
                            let temp = reportDatas[i];
                            let data = getIndexData(yKey['yKey'], allY, temp, allData);

                            for (let j = 0, xLen = xKey.length; j < xLen; j++) {
                                if ($.type(xKey[j]) === 'array') {
                                    // var xKey = [[{name:'export',index:0},{name:'totalImport',index:1}]];
                                    for (let z = 0, zLen = xKey[j].length; z < zLen; z++) {
                                        let obj = xKey[j][z];
                                        data[obj['name']] = temp[obj['name']];
                                        let objIndex = keyArray.indexOf(obj['name']);
                                        if (objIndex === -1) {
                                            keyArray.push(obj['name']);
                                            seriesName.push({name: obj['showName'], value: obj['name']});
                                        }
                                    }
                                } else {
                                    // var xKey = [{name:port, keyArray:[], value:export}]
                                    let obj = xKey[j];
                                    let objIndex = obj['keyArray'].indexOf(temp[obj['name']]);
                                    if (objIndex == -1) {
                                        objIndex = obj['keyArray'].length;
                                        obj['keyArray'].push(temp[obj['name']]);
                                        header_.push(getHeaderConf({
                                            "id": objIndex,
                                            "isleaf": (parseInt(j) + 1) == totalLevel ? 'Y' : 'N',
                                            "level": parseInt(j) + 1,
                                            "name": temp[obj['name']],
                                            "pid": 0,
                                            "reportColumnName": (parseInt(j) + 1) == totalLevel ? (obj['name'] + objIndex) : "",
                                            "treeCode": "1" + objIndex,
                                        }));
                                        seriesName.push({
                                            name: temp[obj['name']],
                                            value: (parseInt(j) + 1) == totalLevel ? (obj['name'] + objIndex) : ""
                                        });
                                    }
                                    data[obj['name'] + objIndex] = temp[obj['value']];
                                }
                            }
                        }
                    }
                    console.timeEnd()
                    let table = $.reportGtstar.initTable();
                    if (table) {
                        $.reportGtstar.currentData['tableDatas'] = table['resultData'];
                    }

                });
            });

        },
        //复制表头thead，实现固定表头
        cloneTableHead: function () {
            $("#theadDiv").empty();
            let tableHead = $("#example_autohead_thead").clone(true).attr("id", "cloneHead");
            $("#theadDiv").html(tableHead);
        },
        resetExportTableHead: function () {
            let firstTr = $("#example_autohead_thead tr:nth-child(1)");

            let colspanNum = $("#example_autohead_tbody tr:nth-child(1) td").length;

            let exportHeadData = {
                title: $.reportGtstar.exportTitle,
                type: reportAllType[$.reportGtstar.exportType],
                time: $.reportGtstar.exportTime
            };

            let exportHtml = `<tr class="none" >
                                 <th colspan=${colspanNum}><h3>${exportHeadData.title}</h3></th>
                             </tr>
                             <tr class="none" >
                                 <th colspan=${colspanNum}><span>报表类型:${exportHeadData.type}</span></th>
                             </tr>
                             <tr class="none">
                                <th colspan=${colspanNum}><span>报表周期:${exportHeadData.time}</span></th>
                            </tr>`;
            firstTr.before(exportHtml);
            // console.log(exportHeadData)
        },
        splitJoint: function () {
            return Array.prototype.join.call(arguments, this.valueSeparator);
        },
        contactAxisName: function (parentName, childName) {
            return parentName + "-" + childName;
        },
        initTable: function () {
            let tableData = $.reportGtstar.currentBackUpData.xAxisName;

            let theTable = $.fn.autoHeader.init({
                laynum: this.currentData.rowlevel,
                colLaynum: this.currentData.collevel,
                headJson: this.currentData.rowHeader_,
                colHeadJson: this.currentData.colHeader_,
                dataJson: $.reportGtstar.currentBackUpData.tableDatas,
                tableid: $.reportGtstar.options['tableId'],
                needsort: true,
                yKey: this.currentData.yKey
            });

            let headHeight = $("#example_autohead_thead").height();
            $("div.content_left").scrollTop(1);
            let scorllVal = $("div.content_left").scrollTop();
            console.log(scorllVal);

            if (scorllVal > 0) {
                $.reportGtstar.cloneTableHead();
                $("#theadDiv.fixedHead").css("height", (headHeight) + "px");
                $.reportGtstar.setTableHeadWidth();
            } else {
                $("#theadDiv.fixedHead").css("height", "0");
            }

            //监听表格中的滚动条,实现表头和表格同时横向滚动
            $("div.content_left").scroll(function (e) {
                let offsetLeft = $("div.content_left").scrollLeft();
                $(".fixedHead").scrollLeft(offsetLeft);
            });

            $.reportGtstar.currentData['tableDatas'] = theTable['resultData'];

            $.reportGtstar.resetExportTableHead();

            this.initView();

            let viewType = $.reportGtstar.reportConfigsData["viewType"];
            if (viewType == "2") {
                setTimeout(function () {
                    $("#loadingWrap").hide();
                }, 1000)
            }

            return theTable;
        },
        // 根据表格内容动态设置表头宽度，即是将thead内各个th的宽度赋值给固定表头cloneHead
        setTableHeadWidth: function () {
            let theadOneRowTh = $("#example_autohead_thead tr:nth-child(1) th");
            let theadTwoRowTh = $("#example_autohead_thead tr:nth-child(2) th");
            let cloneHeadOneRowTh = $("#cloneHead tr:nth-child(1) th");
            let cloneHeadTwoRowTh = $("#cloneHead tr:nth-child(2) th");
            let rowLevel = $.reportGtstar.currentData.rowlevel;
            let thead = $("#example_autohead_thead");
            let clonethead = $("#cloneHead");
            let theadWidth = thead.width();
            // 获取浏览器的类型
            let BrowserType = $.reportGtstar.browserType();
            if (BrowserType == "Chrome") {
                clonethead.width(parseInt(theadWidth, 10));
            } else {
                clonethead.width(theadWidth + 1);
            }

            // 设置表头第二个tr内th的宽度
            if (rowLevel == 1) {
                // 设置表头第一个tr内th的宽度
                for (let i = 0; i < theadOneRowTh.length; i++) {
                    let widthTd = theadOneRowTh.eq(i).width();
                    if (BrowserType == "Chrome") {
                        cloneHeadOneRowTh.eq(i).attr("style", "width:" + (widthTd + 14) + "px");
                    } else {
                        cloneHeadOneRowTh.eq(i).attr("style", "width:" + (widthTd + 13) + "px");
                    }
                }
            } else if (rowLevel == 2) {
                let firstThWidth = theadOneRowTh.eq(0).width();
                if (BrowserType == "Chrome") {
                    cloneHeadOneRowTh.eq(0).attr("width", firstThWidth + 14 + "px");
                    for (let i = 0; i < theadTwoRowTh.length; i++) {
                        let widthTd = theadTwoRowTh.eq(i).width();
                        cloneHeadTwoRowTh.eq(i).attr("style", "width:" + (widthTd + 14) + "px");
                    }
                } else {
                    cloneHeadOneRowTh.eq(0).attr("width", firstThWidth + 13 + "px");
                    for (let i = 0; i < theadTwoRowTh.length; i++) {
                        let widthTd = theadTwoRowTh.eq(i).width();
                        cloneHeadTwoRowTh.eq(i).attr("style", "width:" + (widthTd + 13) + "px");
                    }
                }
            }
        },
        browserType: function () {
            //取得浏览器的userAgent字符串
            let userAgent = navigator.userAgent;
            //判断是否Firefox浏览器
            let isFirefox = userAgent.indexOf("Firefox") > -1;
            //判断是否Opera浏览器
            let isOpera = userAgent.indexOf("Opera") > -1;
            //判断是否Safari浏览器
            let isSafari = userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") == -1;
            //判断Chrome浏览器
            let isChrome = userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Safari") > -1;

            if (isFirefox) return "Firefox";
            if (isOpera) return "Opera";
            if (isSafari) return "Safari";
            if (isChrome) return "Chrome";
        },
        /**
         * 去掉筛选的影响，重新还原数据
         */
        originalDataInitTable: function () {
            this.currentData = $.extend(true, {}, this.currentBackUpData);
            this.initTable();
        },
        //筛选功能的方法
        resetTableRowHeader: function (rowHeaderArray) {
            // 1. 将全部的 rowHeader 放入map中，key为 treeCode
            let backUpRowHeader = this.currentBackUpData['rowHeader_'];
            let rowHeaderMap = {}, newRowHeader = [];

            for (let i = 0, headLen = backUpRowHeader.length; i < headLen; i++) {
                let temp = backUpRowHeader[i];
                rowHeaderMap[temp['treeCode']] = temp;
            }
            // 2. 遍历选中的rowHeader，不重复的放入到最后的生成的数据中
            let areadyPushArray = [];
            let needShowSeriesNames = [];

            for (let i = 0, len = rowHeaderArray.length; i < len; i++) {
                let temp = rowHeaderArray[i];
                if (areadyPushArray.indexOf(temp) === -1) {
                    newRowHeader.push(rowHeaderMap[temp]);
                    areadyPushArray.push(temp);
                    needShowSeriesNames.push(rowHeaderMap[temp]['reportColumnName']);
                }
            }
            this.currentData['rowHeader_'] = newRowHeader;

            let currentSeriesNames = [], seriesNameArr = this.currentBackUpData.seriesName;
            for (let i = 0, seriesLen = seriesNameArr.length; i < seriesLen; i++) {
                let temp = seriesNameArr[i];
                if (needShowSeriesNames.indexOf(temp['value']) != -1) {
                    currentSeriesNames.push(temp)
                }
            }
            this.currentData['seriesName'] = currentSeriesNames;
        },
        resetTableColHeader: function (colHeaderArray) {
            // 先将所有的columnValue列出来，然后遍历参数中的value，
            // 设置datas， 将datas中的相关数据按 columnValue 的 index设置。
            let backUpColHeader = this.currentBackUpData['colHeader_'];
            let colHeaderMap = {}, newColHeader = [], columnValues = [];
            for (let i = 0, len = backUpColHeader.length; i < len; i++) {
                let temp = backUpColHeader[i];
                colHeaderMap[temp['treeCode']] = temp;
            }
            let areadyPushArray = [];
            let needShowXAsisNames = [];

            for (let i = 0, len = colHeaderArray.length; i < len; i++) {
                let temp = colHeaderArray[i];
                if (areadyPushArray.indexOf(temp) === -1) {
                    newColHeader.push(colHeaderMap[temp]);
                    let columnValue = colHeaderMap[temp]['columnValue'];
                    if (columnValue) {
                        columnValues.push(columnValue);
                    }
                    areadyPushArray.push(temp);
                    needShowXAsisNames.push(columnValue);
                }
            }
            this.currentData['colHeader_'] = newColHeader;

            let currentXAxisNames = [], xAxisNameArr = this.currentBackUpData.xAxisName;
            for (let i = 0, len = xAxisNameArr.length; i < len; i++) {
                let temp = xAxisNameArr[i];
                if (needShowXAsisNames.indexOf(temp['value']) != -1) {
                    currentXAxisNames.push(temp)
                }
            }
            this.currentData['xAxisName'] = currentXAxisNames;
            // this.resetDatasByColValues(columnValues);
        },
        resetDatasByColValues: function (columnValues) {
            let backTableDatas = this.currentBackUpData['tableDatas'];
            let newTableDatas = [];
            let validDataCount = 0;
            for (let i = 0, len = backTableDatas.length; i < len; i++) {
                if (validDataCount == columnValues.length) {
                    break;
                }
                let temp = backTableDatas[i];
                let index = columnValues.indexOf(temp[this.currentBackUpData.yKey['yKey']]);
                if (index === -1) {
                    continue;
                }
                newTableDatas[index] = temp;
                validDataCount++;
            }
            this.currentData['tableDatas'] = newTableDatas;
        },
        resetTableHeader: function (header) {
            this.resetTableRowHeader(header['rowHeader']);
            this.resetTableColHeader(header['colHeader']);
            let table = this.initTable();
        },
        getDaysScope: function (str) {
            let reg = /(\d{4})(\d{2})(\d{2})\s(\d{2})-((\d{4})(\d{2})(\d{2})\s(\d{2}))*/gi;
            let resultArr = reg.exec(str);
            let days,   // 相差天数
                endTime, // 结束时间
                startTime = new Date(resultArr[1], resultArr[2] - 1, resultArr[3], resultArr[4]);
            if (resultArr[6] == undefined) {
                endTime = new Date();
            } else {
                endTime = new Date(resultArr[6], resultArr[7] - 1, resultArr[8], resultArr[9]);
            }
            let scopeVal = endTime.getTime() - startTime.getTime();
            if (scopeVal < 0) {
                alert("时间输入有误，请重新输入")
            } else {
                days = Math.floor(scopeVal / (24 * 3600 * 1000));//计算出相差天数
            }
            return days;
        },
        //添加饼状图表头的select框
        getSelectColumnHtml: function (shuxing) {
            let selectHtml = "";
            selectHtml += `<select class="selectRowName"><option disabled value="">请选择一个图形对比数据字段</option>`

            for (let i = 0; i < shuxing.length; i++) {
                selectHtml += `<option value='${shuxing[i].value}'>${shuxing[i].name}</option>`
            }
            selectHtml += `</select>`;
            return selectHtml;
        },
        initView: function () {
            let reportConfig = this.reportConfigsData;
            $.reportGtstar.currentData.chartType = reportConfig.defaultCharts;
            $.reportGtstar.viewChart(reportConfig.defaultCharts);
        },
        viewChart: function (chartType) {
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
                case 'line' :
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['lineSelector']).slideDown();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $.reportGtstar.initLineChart();
                    $('.selectRowName').hide();
                    break;
                case 'area' :
                    $($.reportGtstar.options['barSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideUp();
                    $($.reportGtstar.options['areaSelector']).slideDown();
                    $($.reportGtstar.options['lineSelector']).slideUp();
                    $($.reportGtstar.options['pieSelector']).slideUp();
                    $($.reportGtstar.options['pieCircular']).slideUp();
                    $.reportGtstar.initAreaChart();
                    $('.selectRowName').hide();
                    break;
                case 'annulus' :
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
                case 'pie' :
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
            }, 1000)
        },

        //生成报表筛选功能按钮的方法
        searchMap: function () {
            let formData = $('#form_' + $.reportGtstar.currentData.reportId).serialize(); //TODO
            let searchData = {}, searchKeys = [], searchVal = [];
            console.log(formData)
            let filterArr = $.reportGtstar.reportConfigsData.filter;
            formData = decodeURIComponent(formData);
            let formArray = formData.split("&");
            for (let i = 0, len = formArray.length; i < len; i++) {
                let valArr = formArray[i].split("=");
                let inx = searchKeys.indexOf(valArr[0]);
                if (inx == -1) {
                    searchKeys.push(valArr[0]);
                    searchVal.push(valArr[1])
                } else {
                    searchVal[inx] = searchVal[inx] + "," + valArr[1];
                }
            }
            for (let i = 0, len = searchKeys.length; i < len; i++) {
                if (searchVal[i] && searchVal[i].substr(0, 1) == ",") {
                    searchVal[i] = searchVal[i].substr(1);
                }
                searchData[searchKeys[i]] = searchVal[i]
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
                                let itemArr = item.value.split(',');
                                $('select[name=' + item.field + '] option')
                                    .each(function (i, content) {
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
                })
            }

            let keys = Object.keys(searchData);

            for (let i in keys) {
                let key = keys[i];
                if (key.endsWith("1")) {
                    let temp = key.substr(0, key.length - 1);
                    if ($.type($.reportGtstar.filterMap[temp]) === "array") {

                        $.reportGtstar.filterMap[temp][0] = searchData[key];
                    } else {
                        $.reportGtstar.filterMap[temp + ""] = [searchData[key]];
                    }
                } else if (key.endsWith("2")) {
                    let temp = key.substr(0, key.length - 1);
                    if ($.type($.reportGtstar.filterMap[temp]) === "array") {
                        $.reportGtstar.filterMap[temp][1] = searchData[key];
                    } else {
                        $.reportGtstar.filterMap[temp + ""] = ["", searchData[key]];
                    }
                } else {
                    $.reportGtstar.filterMap[key + ""] = searchData[key];
                }
            }
        },
        initAllChartData: function () {
            let gtCharts = this.currentData;
            let defaultChartData = [],
                xAxis = [],
                defaultChartDataLength = 20;  // 默认设置当只有一个y时，图形展示表格中前20条数据

            let chartData = this.currentData.tableDatas,
                xAxisNames = this.currentData.xAxisName,
                selectRowIndex = this.currentData.selectRowIndex,
                seriesNames = this.currentData.seriesName;

            //去除所有选中行的样式
            $("#example_autohead_tbody tr").removeClass("select");
            let y1 = gtCharts.y1,
                // kArray为存储表格上所有被选中行的下标值数组
                kArray = [];
            //当selectRowIndex数组的长度为零时，即为初始默认状态
            if (selectRowIndex && selectRowIndex.length == 0) {
                // 当表格中有两个y时 图形展示表格中以y1分组的第一个y2的所有数据 ；
                // 即第一个网元id中所有的网元
                if (gtCharts.collevel == "2") {
                    for (let k in chartData) {
                        if (chartData[0][y1] == chartData[k][y1]) {
                            // 得到默认选中第一个网元每行的下标数组
                            kArray.push(parseInt(k));
                        }
                    }
                } else {
                    let dataLen = chartData.length;
                    dataLen = dataLen > defaultChartDataLength ? defaultChartDataLength : dataLen;
                    for (let i = 0; i < dataLen; i++) {
                        kArray.push(i)
                    }
                }
            } else {
                kArray = selectRowIndex;
            }

            for (let key = 0, kLen = kArray.length; key < kLen; key++) {
                let selectItem = kArray[key];
                let i = parseInt(selectItem, 10);
                // 给表格上所有的选中行添加select样式
                $("#example_autohead_tbody tr").eq(i).addClass("select");
                let itemData = chartData[selectItem];
                defaultChartData.push(itemData);
                let itemxAxis = xAxisNames[selectItem];
                xAxis.push(itemxAxis);
            }
            return {defaultChartDatas: defaultChartData, xAxis: xAxis, seriesNames: seriesNames};
        },
        //处理生成图的数据
        initChartData: function () {
            let allChartData = this.initAllChartData();
            // console.log(allChartData);
            let chartDataArray = allChartData.defaultChartDatas,
                xAxisArray = allChartData.xAxis,
                seriesNames = allChartData.seriesNames;

            let xAxisShowName = [], xAxisShowValue = [];
            for (let i in xAxisArray) {
                let xAxisObj = xAxisArray[i];
                xAxisShowName.push(xAxisObj.name);
                xAxisShowValue.push(xAxisObj.value);
            }

            let datas = [], legend = [];
            for (let i = 0, seriesLen = seriesNames.length; i < seriesLen; i++) {
                let seriesName = seriesNames[i];
                legend.push(seriesName['value']);
                datas.push({name: seriesName['name'], data: []});
            }
            for (let i = 0, len = chartDataArray.length; i < len; i++) {
                let data = chartDataArray[i];
                for (let j = 0, legLen = legend.length; j < legLen; j++) {
                    let legendJ = legend[j];
                    let dataVal = parseFloat(data[legendJ]);
                    if (isNaN(dataVal)) {
                        dataVal = 0;
                    }
                    datas[j]['data'].push(dataVal);
                }
            }
            return {xAxis: xAxisShowName, datas: datas};
        },
        //生成柱状图
        initColumnChart: function () {
            let chartData = this.initChartData();
            let options = {
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
        initLineChart: function () {
            let chartData = this.initChartData();
            let options = {
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
        initAreaChart: function () {
            let chartData = this.initChartData();
            let options = {
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
        initPieChartDatas: function (selectValue) {
            let allChartData = this.initAllChartData();
            let chartDataArray = allChartData.defaultChartDatas,
                xAxisArray = allChartData.xAxis,
                seriesNames = allChartData.seriesNames;
            let selectIndex = 0;
            let selectValues = [];
            for (let i = 0, seriesLen = seriesNames.length; i < seriesLen; i++) {
                let seriesName = seriesNames[i];
                selectValues.push(seriesName);
                if (selectValue && !selectIndex && seriesName['value'] === selectValue) {
                    selectIndex = i;
                }
            }
            let pie = seriesNames[selectIndex].name;
            let valueKey = seriesNames[selectIndex].value;
            let yKey = this.currentData.yKey['yKey'];

            let xAxisShowName = [];
            let xAxisShowValue = [];
            for (let i = 0, len = xAxisArray.length; i < len; i++) {
                let xAxisName = xAxisArray[i];
                xAxisShowName.push(xAxisName['name']);
                xAxisShowValue.push(xAxisName['value'])
            }

            let pieDatas = [];
            for (let i = 0, len = chartDataArray.length; i < len; i++) {
                let data = chartDataArray[i];
                let yValue = data[valueKey];
                if (yValue == undefined) {
                    yValue = 0;
                }
                pieDatas.push({name: xAxisShowName[xAxisShowValue.indexOf(data[yKey])], y: parseFloat(yValue)});
            }
            $('.selectRowName').remove();
            let selectColumnName = this.getSelectColumnHtml(selectValues);

            return {pieName: pie, pieDatas: pieDatas, selectColumnName: selectColumnName}
        },
        //根据选择的表头字段重新生成饼状图
        resetInitPieChart: function (selectValue) {
            let pieChartData = this.initPieChartDatas(selectValue);
            let options = {
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
                    printButton: {    //配置打印按钮

                    },
                    exportButton: {    //配置导出按钮

                    },
                    filename: pieChartData.pieName + "饼状图", //下载显示的文件名称
                    sourceWidth: 1000,     //下载图片的宽度
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
        initCircularPieChart: function (selectValue) {
            let pieChartData = this.initPieChartDatas(selectValue);
            let options = {
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
                    printButton: {    //配置打印按钮

                    },
                    exportButton: {    //配置导出按钮

                    },
                    filename: pieChartData.pieName + "环形图", //下载显示的文件名称
                    sourceWidth: 1000,     //下载图片的宽度
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
