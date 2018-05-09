/**
 * Created by songfei on 2017/9/12.
 */

const reportAllType = {
    "1": "年报",
    "2": "季报",
    "3": "月报",
    "4": "周报",
    "5": "日报",
    "6": "时报"
};
let reportId = common.GetQueryString("reportId");
$.reportGtstar.currentData.reportId = reportId;

$(function () {
    $.reportGtstar.initReportConfigs({
        tableId: 'example',
        filterSelector: '#reportFilter',
        barSelector: '#container1',
        pieSelector: '#container3',
        pieCircular: '#container4',
        lineSelector: '#container2',
        areaSelector: '#container5',
        initReport: function (configs) {
            // 当viewType =2时 仅显示表格
            if (configs.viewType && configs.viewType == "2") {
                configs.defaultCharts = null;
                $("#chartsLogo").hide();
                $(".isChartHidden").hide();
            }
            // 当viewType =1时 仅显示图形
            if (configs.viewType && configs.viewType == "1") {
                $("#exampleDiv").hide();
            }
            // 当exportFormat为空或等于0 时，导出按钮不可见
            if (!configs.exportFormat || configs.exportFormat == "0") {
                $("#exportButton").css("visibility", "hidden");
            }
            //设置页面标题  判断是否有别名；如果有则优先显示别名
            if (configs.reportAlias) {
                $("#reportName").html(configs.reportAlias);
                $.reportGtstar.exportTitle = configs.reportAlias;
            } else {
                $("#reportName").html(configs.reportName);
                $.reportGtstar.exportTitle = configs.reportName;
            }
            $.reportGtstar.getReport(reportId);
        }
    });


    // 导出报表按钮

    $("#exportButton").click(function () {
        let exportTitleFormat = $.reportGtstar.reportConfigsData.exportTitleFormat;
        if (exportTitleFormat) {
            let [a, b, c, d, e, f, g] = exportTitleFormat.split("|");
            let exportArr = [b, d, f];
            let arr = [];
            for (let i in exportArr) {
                switch (exportArr[i]) {
                    case '报表名':
                        arr[i] = $.reportGtstar.exportTitle;
                        break;
                    case '类型' :
                        arr[i] = reportAllType[$.reportGtstar.exportType];
                        break;
                    case '周期' :
                        arr[i] = $.reportGtstar.exportTime;
                        break;
                    default:
                        arr[i] = "";
                        break;
                }
            }
            $.reportGtstar.exportFileName = a + arr[0] + c + arr[1] + e + arr[2] + g;
        } else {
            $.reportGtstar.exportFileName = $.reportGtstar.exportTitle
        }
        $("#example").table2excel({
            name: "report excel output result",
            filename: $.reportGtstar.exportFileName
//                $.reportGtstar.exportTitle + "_" + reportAllType[$.reportGtstar.exportType] + "_" + $.reportGtstar.exportTime + "_" + new Date().Format("yyyyMMdd hh:mm:ss") + "_" + exportId
        });
    });

});
//格式化日期
Date.prototype.Format = function (fmt) {
    var o = {
        "y+": this.getFullYear(),
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S+": this.getMilliseconds()             //毫秒
    };
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            if (k == "y+") {
                fmt = fmt.replace(RegExp.$1, ("" + o[k]).substr(4 - RegExp.$1.length));
            }
            else if (k == "S+") {
                let lens = RegExp.$1.length;
                lens = lens == 1 ? 3 : lens;
                fmt = fmt.replace(RegExp.$1, ("00" + o[k]).substr(("" + o[k]).length - 1, lens));
            }
            else {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
    }
    return fmt;
};

$(document).ready(function () {
    $("#hideChart").click(function () {
        $('#chartDiv').slideUp();
        $("#showChart").show();
        $("#hideChart").hide()
    });
    $("#showChart").click(function () {
        $('#chartDiv').slideDown();
        $("#hideChart").show();
        $("#showChart").hide();
    })

});
//过滤图标点击事件
$(".filter").click(function () {
    let filterConfig = $.reportGtstar.reportConfigsData["filter"];

    if (filterConfig && filterConfig.length != 0) {
        if (filterConfig.length == 1 && filterConfig[0].type == "data_filter") {
            alert("无配置筛选条件");
            return;
        }
        $(".searchRow").slideToggle();
        $(".sectionWrap").toggleClass("top");
    } else {
        alert("无配置筛选条件")
    }

});

function showChart(chartType) {
    $.reportGtstar.currentData.chartType = chartType;
    let flag = $.reportGtstar.currentData.isShow;
    if (!flag) {
        alert("该报表无数据,无法生成图形");
        return;
    }
    $.reportGtstar.viewChart(chartType);
}

$("#createHeaderDivBtn").click(function () {
    let rowHeader = $.reportGtstar.currentBackUpData['rowHeader_'];
    let colHeader = $.reportGtstar.currentBackUpData['colHeader_'];
    if (!$.reportGtstar.filterTrue) {
        $('#modal2 .lt .showul').html(filterListView(rowHeader));
        $('#modal2 .rt .showul').html(filterListView(colHeader));
    }
    $('#modal2').toggle("slow");
});
//获取列头名以及第一列数据到筛选条件列表上
function filterListView(datas) {
    let html = "<li><input class='all-select' type='checkbox' checked /><span class='selectAll'>全选</span></li>";
    let fatherData = [];
    let childrenData = [];
    //获取父级
    $.each(datas, function (i, item) {
        if (item['isleaf'] == 'N') {
            fatherData.push({'name': item.name, 'treeCode': item.treeCode})
        } else {
            childrenData.push({
                'name': item.name,
                'treeCode': item.treeCode,
                'reportColumnName': item['reportColumnName'],
                'columnValue': item['columnValue']
            })
        }
    });
    if (fatherData.length > 0) {
        $.each(fatherData, function (index, fItem) {
            html += `<li style="font-size:14px;font-weight:bold"><input type="checkbox" class="father-treecode"  data-fTreeCode="${fItem.treeCode}" checked="true"/><span class="fatherspan">${fItem.name}</span></li>`
            $.each(childrenData, function (i, cItem) {
                if (cItem.treeCode.startsWith(fItem.treeCode)) {
                    html += `<li>&nbsp;&nbsp;<input type="checkbox" checked="true" class="toggle-vis" data-fTreeCode="${fItem.treeCode}" data-treeCode="${cItem['treeCode']}" /><span class="childrenspan">${cItem.name}</span></li>`;
                }
            })
        })
    } else {
        $.each(childrenData, function (i, cItem) {
            html += `<li>&nbsp;&nbsp;<input type="checkbox" checked="true" class="toggle-vis" data-treeCode="${cItem['treeCode']}" value='${cItem.name}' /><span class="childrenspan">${cItem.name}</span></li>`;
        })
    }
    return html;
}
$("#modal2").on("click", "span.selectAll", function () {
    if ($(this).prev("input[type='checkbox']").is(":checked")) {
        $(this).prev("input[type='checkbox']").prop("checked", false);
    } else {
        $(this).prev("input[type='checkbox']").prop("checked", true);
    }
    $(this).prev("input[type='checkbox']").change();
})
$("#modal2").on("click", "span.childrenspan", function () {
    // console.log($(this).prev("input[type='checkbox']").is(":checked"))
    if ($(this).prev("input[type='checkbox']").is(":checked")) {
        $(this).prev("input[type='checkbox']").prop("checked", false);
    } else {
        $(this).prev("input[type='checkbox']").prop("checked", true);
    }
    $(this).prev("input[type='checkbox']").change();
})
//每个子项影响父集以及全选;
$("#modal2").on("change", ".toggle-vis", function () {
    let val = $(this).is(":checked");
    // console.log(val);
    let fTreeCode = $(this).attr("data-fTreeCode");
    // console.log(fTreeCode);
    if (!val) {
        $(this).parent().parent().find(".all-select").prop("checked", false);
        $(".father-treecode[data-fTreeCode='" + fTreeCode + "']").prop("checked", false);
    } else {
        let childrenState = true;
        if (fTreeCode) {
            $.each($(".toggle-vis[data-fTreeCode='" + fTreeCode + "']"), function (index, item) {
                if (!$(item).is(":checked")) {
                    childrenState = false;
                    return;
                }
            });
            $(".father-treecode[data-fTreeCode='" + fTreeCode + "']").prop("checked", childrenState);
            let fatherState = true;
            $.each($(".father-treecode"), function (index, item) {
                if (!$(item).is(":checked")) {
                    fatherState = false;
                    return;
                }
            });
            $(this).parent().siblings("li").children(".all-select").prop("checked", fatherState);
        } else {
            $.each($(this).parent().siblings("li"), function (index, item) {
                if ($(item).children("input[type='checkbox']").hasClass("toggle-vis")) {
                    if (!$(item).children("input[type='checkbox']").is(":checked")) {
                        childrenState = false;
                        return;
                    }
                }
            });
            // console.log(childrenState);
            $(this).parent().siblings("li").children(".all-select").prop("checked", childrenState);
        }
    }
});


//模态框父集选择事件
$("#modal2").on("change", ".father-treecode", function () {
    let val = $(this).attr("data-fTreeCode");
    if ($(this).is(":checked")) {
        $("#modal2").find("input[data-fTreeCode='" + val + "']").prop("checked", true);
    } else {
        $("#modal2").find("input[data-fTreeCode='" + val + "']").prop("checked", false);
    }
    let fatherState = true;
    $.each($(".father-treecode"), function (index, item) {
        if (!$(item).is(":checked")) {
            fatherState = false;
            return;
        }
    });
    $(this).parent().siblings("li").children(".all-select").prop("checked", fatherState);
});
//  //模态框父集显示所包含子集事件
$("#modal2").on("click", ".fatherspan", function () {
    var val = $(this).prev().attr("data-ftreecode");
    $(".toggle-vis[data-ftreecode='" + val + "']").parent().toggleClass("hide");
})
//模态框全选选择事件
$("#modal2").on("change", ".all-select", function () {
    if ($(this).is(":checked")) {
        $(this).parent().siblings("li").children("input[type='checkbox']").prop("checked", true);
    } else {
        $(this).parent().siblings("li").children("input[type='checkbox']").prop("checked", false);
    }
});
//筛选条件取消事件
$("#filterCancel").click(function () {
//        $(".showul").html("");
    $('#modal2').toggle();
});
$("#filterBtn").click(function () {
    let selectedCol = [];
    let selectedRow = [];

    if (selectedCol == null && selectedRow == null) {
        $.reportGtstar.originalDataInitTable();
        return;
    }

    let filterData = {};

    filterData['rowHeader'] = [];
    filterData['colHeader'] = [];
    //获取左边边的筛选条件
    $.each($("#modal2 .lt .toggle-vis"), function (i, item) {
        if ($(item).is(":checked")) {
            filterData['rowHeader'].push($(item).data('treecode'));
            let ftreecode = $(item).data('ftreecode');
            if (ftreecode) {
                filterData['rowHeader'].push(ftreecode);
            }
        }
    });
    //获取右边的筛选条件
    $.each($("#modal2 .rt .toggle-vis"), function (i, item) {
        if ($(item).is(":checked")) {
            filterData['colHeader'].push($(item).data('treecode'));
            let ftreecode = $(item).data('ftreecode');
            if (ftreecode) {
                filterData['colHeader'].push(ftreecode);
            }
        }
    });
    console.log(filterData)
    $.reportGtstar.filterTrue = true;
    $.reportGtstar.resetTableHeader(filterData);
    $('#modal2').removeAttr("style");
});

$(document).on("change", ".selectRowName", function () {
    let selectRowName = $('.selectRowName').val();
    let currentChartType = $.reportGtstar.currentData.chartType;

    if (currentChartType && currentChartType == "pie") {
        $.reportGtstar.resetInitPieChart(selectRowName);
    } else if (currentChartType == "annulus") {
        $.reportGtstar.initCircularPieChart(selectRowName);
    }

    $('.selectRowName').val(selectRowName)
});
$.reportGtstar.filterMap = {};

/* $(document).on("change", "#neidlist", function () {
 let neIds = $('#neidlist').val();
 //        let currentChartType = $.reportGtstar.currentData.chartType;

 $.reportGtstar.filterMap["neid"] = neIds;
 // console.log($.reportGtstar.filterMap)

 });*/

$(".ipText").focus(function () {
    $(".cueInfo").show();
})
    .blur(function () {
        $(".cueInfo").hide();
    })
    .keyup(function (e) {
        $.reportGtstar.reportTime = e.target.value;
    });

const regObj = {
    "1": /^\d{4}\-*(\d{4})*$|^\d{4}(,\d{4})*$/,
    "2": /^\d{4}\d{2}\-*(\d{4}\d{2})*$|^\d{4}\d{2}(,\d{4}\d{2})*$/,
    "3": /^\d{4}\d{2}\-*(\d{4}\d{2})*$|^\d{4}\d{2}(,\d{4}\d{2})*$/,
    "4": /^\d{4}\d{2}\-*(\d{4}\d{2})*$|^\d{4}\d{2}(,\d{4}\d{2})*$/,
    "5": /^\d{4}\d{2}\d{2}\-*(\d{4}\d{2}\d{2})*$|^\d{4}\d{2}\d{2}(,\d{4}\d{2}\d{2})*$/,
    "6": /^\d{4}\d{2}\d{2}\s\d{2}\-*(\d{4}\d{2}\d{2}\s\d{2})*$|^\d{4}\d{2}\d{2}\s\d{2}(,\d{4}\d{2}\d{2}\s\d{2})*$/
};

$("#selectTime").change(function () {
    let reportType = $("#selectTime").val();
    $.reportGtstar.reportType = reportType;
});

$("#reportBtn").on('click', function () {
    $.reportGtstar.filterTrue = false;
    let typeVal = $("#selectTime").val();

    if (!($.reportGtstar.currentData.reportId && typeVal)) {
        alert("请选择要生成的报表类型");
        return;
    }

    let tVal = $(".ipText").val().replace(/(^\s*)|(\s*$)/g, "");
    if (tVal == '') {
        alert("输入的时间不能为空");
        return;
    }

    if (regObj[typeVal] && !RegExp.prototype.exec.call(regObj[typeVal], tVal)) {
        alert("格式不正确，请重新输入时间");
        return;
    }

    // 当选择时报，时间范围超过10天给出提示
    if (typeVal == "6" && tVal.indexOf("-") != -1) {
        let days = $.reportGtstar.getDaysScope(tVal);
        if (days >= 10) {
            if (confirm("查询的时间范围已超过10天,是否继续？") == false) {
                return
            } else {
                $("#loadingWrap").show();
            }
        }
    }

    $.reportGtstar.searchMap();

    $.reportGtstar.getReport($.reportGtstar.currentData.reportId);

    $.reportGtstar.exportType = $.reportGtstar.reportType;
    $.reportGtstar.exportTime = $.reportGtstar.reportTime;

    setTimeout(function () {
        $("#loadingWrap").hide();
    }, 1000)
});


//直接对表格每行作选中操作
$(document).on("click", "#example_autohead_tbody tr", function () {
    let alltr = $("#example_autohead_tbody tr");
    let tr = $(this);
    let thisTrIndex = parseInt(tr.index(), 10);
    let selectRowIndex = [];
    //遍历所有tr节点
    for (let i = 0; i < alltr.length; i++) {
        let itr = alltr.eq(i);
        //找出所有选中的行
        if (itr.hasClass("select")) {
            // 得到所有选中行下标值，push到selectRowIndex数组中
            let idx = parseInt(itr.index(), 10);
            selectRowIndex.push(idx);
        }
    }
    let trIndex = selectRowIndex.indexOf(thisTrIndex);
    // console.log(trIndex);
    if (trIndex != -1) {
        selectRowIndex.splice(trIndex, 1);
    } else {
        selectRowIndex.push(thisTrIndex);
    }
    selectRowIndex.sort(function (a, b) {
        return a - b;
    });
    // console.log(selectRowIndex);
    $.reportGtstar.currentData.selectRowIndex = selectRowIndex;

    let selectChartType = $.reportGtstar.currentData.chartType;

    $.reportGtstar.viewChart(selectChartType);
})
