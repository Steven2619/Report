(function($){
  $.reportGtstar = $.reportGtstar || {};
  var indicatorData={
    length:0,
    reportindicatorConfig:{}
  };//保存视图指标信息
  var ajaxUrl;
  var dataSrue;
  var exportopts={
    "exportTitleFormat":[],
    "istrue":true,
    "isfirst":false
  }
  var Verification={
    "reportName":true,
    "reportAlias":true
  };
  // var _html="";
//  $.reportConfigData = $.reportConfigData || {};//该变量保存 配置页面设置的信息
// var opt={
//   "url":"",
//   "methed":"",
//   "data":"",
//   "contentType":"",
//   "async":"",
//   callback:function(){
//   }
// }
  $.reportConfigData={
          "chartColors":'',
          "colLevel":'',
          "defaultCharts":'',
          "enableFlag":'',
          "exportFormat":'',
          "filter":[],
          "fontFamily":'',
          "reportAlias":'',
          "reportIndicatorConfig":[],
          "reportName":'',
          "rowLevel":'',
          "tableIds":'',
          "viewType":'',
          "exportTitleFormat":''
        };
  $.extend($.reportGtstar,{
    getReportList:function(){
      var opt={
        "url":common.getbaseUrl()+"reportConfigs/",
        "methed":"get",
        "data":true,
        "contentType":"",
        "async":true,
        "callback":function(data){
          // console.log(data);
          var html="";
           $.each(data,function(i,item){
             var viewType;
             if(item['viewType']==0){
               viewType="图表";
             }else if(item['viewType']==1) {
               viewType="图";
             }else if(item['viewType']==2){
               viewType="表";
             };
             var defaultCharts;
             if(item['viewType']!==2){
               if(item['defaultCharts']=='bar'){
                 defaultCharts="柱状图";
               }else if(item['defaultCharts']=='line'){
                 defaultCharts="折线图";
               }else if(item['defaultCharts']=='pie'){
                 defaultCharts="饼状图";
               }else if(!item['defaultCharts']){
                 defaultCharts="无图形";
               };
             }else{
               defaultCharts="无图形";
             }

             var enableFlag=(item['enableFlag']==1)?"启用":"禁用";
             var message=(item['enableFlag']==1)?"禁用":"启用";

             html+=`
             <tr data-reportId="${item['id']}">
               <td width="30%" style="min-width:150px;">${item['reportName']}</td>
               <td width="20%" style="min-width:100px;">${item['reportAlias']}</td>
               <td width="10%" style="min-width:100px;">${viewType}</td>
               <td width="10%" style="min-width:100px;">${defaultCharts}</td>
               <td width="5%"  style="min-width:70px;" name='enableFlag'>${enableFlag}</td>
               <td width="15%" style="min-width:15px;">
                 <button class='btn btn-primary' value='edit' onclick='$.reportGtstar.editReport(${item['id']})' >编辑</button>
                 <button class='btn btn-danger' value="delete" onclick='$.reportGtstar.deleteModal(${item['id']})'>删除</button>
                 <button class='btn btn-primary' value='editEnableFlag' onclick='$.reportGtstar.editEnableFlag(${item['id']},${item['enableFlag']})' >${message}</button>
                 <button class="btn btn-info" data-toggle="modal" data-target="#detailsModal"  value="details" onclick='$.reportGtstar.detailsModal(${item['id']})'>查看</button>
               </td>
             </tr>
             `;
           });
          $('#configListTable tbody').html(html);
          $("#configListTable").DataTable({
                   "pagingType":"full_numbers",
                   "bSort": false,
                   "search":{ "Search": "","caseInsensitive":false, "Regex": false, "Smart": false },
                "srarching":true,
                "columnDefs":[
                  {
                     "targets":[5],
                     "searchable":false
                   }
                ],
          });
          $("#configListTable").attr("style","margin-top:0");
        }
      }
    common.sendAjax(opt);
    },
    //查看详细配置表
    detailsModal:function(reportid){
      //detailsModal
      var reportopt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid,
        "methed":"get",
        callback:function(data){
          var reportName=data.reportAlias?data.reportAlias:data.reportName;
            $("#detailsLabel").html(reportName);
        },
        error:function(){
            alter("该表查询失败,请刷新页面或者联系系统管理员");
        }
      };
      var filtersopt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid+"/filters",
        "methed":"get",
        callback:function(data){
          var html="";
          $.each(data,function(index,item){
            var label,type,placeholder,isData_filter=true;
            label=item.label;
            switch (item.type) {
              case "input":
                $.each(data,function(i,j){
                  if(j.field===item.field){
                    if(j.type==="data_filter"){
                      isData_filter=false;
                      return;
                    }
                  }
                })
                if(isData_filter){
                  type="输入框";
                  placeholder=item.placeholder;
                }
                break;
              case "select":
                type="单选下拉框";
                placeholder=item.value;
                break;
              case "scope":
                type="范围";
                placeholder="";
                break;
              case "select_mul":
                $.each(data,function(i,j){
                  if(j.field===item.field){
                    if(j.type==="data_filter"){
                      isData_filter=false;
                      return;
                    }
                  }
                });
                if(isData_filter){
                type="多选下拉框";
                placeholder=item.value;
                }
                break;
              case "data_filter":
                var isCheck=false;
                $.each(data,function(i,j){
                  if(j.field===item.field){
                    if(j.type!=="data_filter"){
                      isCheck=true;
                    }
                  }
                });
                if(isCheck){
                  type="定制(页面可选)";
                }else{
                  type="定制";
                }
                placeholder=item.value;
                break;
              default:
                type="其他";
                placeholder="";
            };
            if(isData_filter){
              html+=`<tr>
                <td>${label}</td>
                <td>${type}</td>
                <td>${placeholder}</td>
              </tr>`
            }
          });
          $("#detailsModal .fltersList tbody").html(html);
        },
        error:function(){
            $("#detailsModal .fltersList tbody").html("<tr><td  colspan='3'>无筛选条件</td></tr>");
            //console.log("没有筛选条件");
        }
      }
      var indicatorsopt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid+"/indicators",
        "methed":"get",
        callback:function(data){
          var html="",zlen;
          var y1len=0,y2len=0,x1len=0,x2len=0,zlen=0,alllen=0,isallgroup=true,isonegroup=false,isRightConfig=true,message="";
          var html="",y1body="",x1body="",x2body="",zbody="",y2body="";
          $.each(data,function(index,item){
            if(item.indicatorType==="z")zlen=1;
          });
          $.each(data,function(index,item){
            if(item.indicatorType==="y1"){
              y1len+=1;
            }else if(item.indicatorType==="x1"){
              x1len+=1;
              if((!item.groupFlag)&&isallgroup){
                isallgroup=false;
              }
              if(item.groupFlag&&(!isonegroup)){
                isonegroup=true;
              }
            }else if (item.indicatorType==="z"){
              zlen+=1;
            }else if(item.indicatorType==="y2"){
              y2len+=1;
            }else if(item.indicatorType==="x2"){
              x2len+=1;
            }
          })
          $.each(data,function(index,item){
            if(item.indicatorType==="y1"){
              y1body+=`<th>${item.indicatorAlias}</th>`;
            }else if(item.indicatorType==="x1"){
              x1body+=`<th colspan="${x2len}">${item.indicatorAlias}</th>`;
            }else if (item.indicatorType==="z"){
              let colspan;
              if(x2len==0){
                colspan=x1len;
              }else{
                colspan=x1len*x2len;
              }
              zbody=`<th colspan="${colspan}">${item.indicatorAlias}</th>`;
            }else if(item.indicatorType==="y2"){
              y2body+=`<th>${item.indicatorAlias}</th>`;
            }else if(item.indicatorType==="x2"){
              x2body+=`<th>${item.indicatorAlias}</th>`;
            }
          });
          html=`
          <tr><th colspan="${y2len+1}">&nbsp&nbsp</th>${x1body}</tr>
          <tr>${y1body}${y2body}
          `;
          if(x2len>0){
            for(var j=0;j<x1len;j++){
              html+=`${x2body}`
            }
            if(isallgroup){
              html+=`</tr><tr><th colspan="${y1len+y2len}">&nbsp;</th>${zbody}`;
            }
          }else if(x2len==0){
            if(isallgroup){
              html+=`${zbody}`;
            }else{
              for(var i=0;i<x1len;i++){
                html+=`<th>&nbsp;&nbsp;</th>`
              };
            }
          }
          html+=`</tr>`;
          $("#detailsModal .indicators thead").html(html);
        }
      }
      common.sendAjax(reportopt);
      common.sendAjax(filtersopt);
      common.sendAjax(indicatorsopt);
    },
    //删除配置表提示
    deleteModal:function(reportid){
      // :nth-child(2)")
      var reportName=$("tr[data-reportId='"+reportid+"'] td:nth-child(2)").html();
      if(!reportName){
        // console.log("进来了");
        reportName=$("tr[data-reportId='"+reportid+"'] td:first-child").html();
      }
      var html=`  <h4 class="title">提示</h4>
        <div>是否要删除"${reportName}"表</div>
        <div class="btngroup"><button class="btn btn-info" onclick="$.reportGtstar.deleteReport(${reportid})">确定</button><button onclick="$.reportGtstar.cancelDelete()" class="btn btn-default">取消</button></div>
      `
      $("#deleteModal").html(html).addClass("cue").removeClass("hide");
      $("#cover").show();
    },
    // 取消删除
    cancelDelete:function(){
      $("#deleteModal").html("").removeClass("cue").addClass("hide");
      $("#cover").hide();
    },
    //删除配置表
    deleteReport:function(reportid){
      var opt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid,
        "methed":"delete",
        "data":"",
        "contentType":"",
        "async":"",
        callback:function(data){
          $("#deleteModal").html("").removeClass("cue").addClass("hide");
          $("#cover").hide();
          alert("删除成功");
          location.reload();
        },
        error:function(){
          alert("删除失败,请重试或联系管理员");
        }
      }
      common.sendAjax(opt);
    },
    //更改表格的启用标识
    editEnableFlag:function(reportid,status){
      status==1?status=0:status=1;
      var opt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid+"/status?status="+status,
        "methed":"put",
        'Content-Type':'application/json',
        callback:function(data){
          alert("标识已更改");
          var msg=status==0?"启用":"禁用";
          var str=status==0?"禁用":"启用";
          $("tr[data-reportId='"+reportid+"'] td[name='enableFlag']").html(str);
          $("tr[data-reportId='"+reportid+"'] td>button[value='editEnableFlag']")
          .attr("onclick","$.reportGtstar.editEnableFlag('"+reportid+"','"+status+"')")
          .html(msg)
          // location.reload();
        }
      }
      common.sendAjax(opt);
    },
    //修改配置表__________________________________________开始_________________________________________
    editReport:function(reportid){
      $("#addReport").toggleClass("hide");
        $("#cover").attr("style","display:block");
      // console.log("要编辑"+reportid);
          $.reportConfigData['reportId']=reportid;
          exportopts['isfirst']=true;
      var opt={
        "url":common.getbaseUrl()+"reportConfigs/"+reportid,
        "methed":"get",
        "async":false,
        callback:function(data){
            // console.log(data);
            if(data){
              $("#reportName").attr("value",data.reportName);
              $("#reportAlias").attr("value",data.reportAlias);
              $("input:radio[name='export'][value='"+data.exportFormat+"']").prop('checked','checked');
              if(data.exportFormat===1){
                var exportsult=[];
                if(data.exportTitleFormat!==""||data.exportTitleFormat!==null){
                  exportsult=data.exportTitleFormat.split("|");
                }
                if(exportsult.length===0){
                  exportopts.exportTitleFormat=[];
                  // console.log("后缀名设置空的");
                }else{
                  exportopts.exportTitleFormat=exportsult;
                  $(".Connectordiv1 input").prop("value",exportsult[0]);
                  if(exportsult[1]){
                    $("#exportopt1 option[text='"+exportsult[1]+"']").prop("selected",true);
                    $("#exportopt1").trigger("change");
                  }
                  $(".Connectordiv2 input").prop("value",exportsult[2]);
                  if(exportsult[3]){
                    $("#exportopt2 option[text='"+exportsult[3]+"']").prop("selected",true);
                    $("#exportopt2").trigger("change");
                  }
                  $(".Connectordiv3 input").prop("value",exportsult[4]);
                  if(exportsult[5]){
                    $("#exportopt3 option[text='"+exportsult[5]+"']").prop("selected",true);
                    $("#exportopt3").trigger("change");
                  }
                  $(".Connectordiv4 input").prop("value",exportsult[6]);
                  // console.log(exportsult);
                  exportsult=exportsult.join("");
                  exportsult+=".后缀名";
                  exportsult=$.trim(exportsult);
                  $("#exportpreview").prop("value",exportsult)
                                     .removeAttr("style");
                  // console.log("后缀名有设置");
                }
              }else{
                  $("div.exportoptdiv").hide();
              }
              if(data.viewType==2){
                $("#ChartTypes").hide("slow");
              }else{
                $("input:radio[name='chartView'][value='"+data.defaultCharts+"']").prop("checked",'checked');
              }
              $("input:radio[name='reportView'][value='"+data.viewType+"']").prop("checked",'checked');
              $("#selectReport").find("option[data-reportname='"+data.tableIds+"']").prop("selected",true);
              $("#selectReport").trigger("change");

            }
              // console.log("完成全部");
          }
      }
      common.sendAjax(opt);
      exportopts.isfirst=false;
    },
      //修改配置表____________________________________________结束____________________________________
    getReportView:function(){
      //基础报表数据绑定
      var opt={
        "url":common.getbaseUrl()+"tables/",
        "methed":"get",
        callback:function(data){
          var html="<option value='0'>请选择基础报表</option>";
           $.each(data,function(i,report){
             html+=`
               <option value="${report.id}" data-reportName="${report.name}">${report.alice}</option>
             `;
           });
          $('#selectReport').html(html);
        }
      }
      common.sendAjax(opt);
       $.reportGtstar.restreportConfigData();
    },
    //基础表获取指标项事件
    getcolumnsByreportId:function(rID){
      var opt={
        "url":common.getbaseUrl()+"tables/"+rID+"/columns/",
        "methed":"get",
        "async":false,
        callback:function(datas){
          var html="";
          $.each(datas,function(index,item){
            item.remarks=item.remarks||item.columnName;
            html+=`<div class="row">
              <label ><input class="isCheck" type="checkbox" value="${item.columnName}" name="${item.columnName}"></label>
              <label class="isdisabled"><input type="text" value="${item.remarks}" data-columnAlias="${item.remarks}" data-indicatorName="${item.columnName}" class='form-control indicatorName' disabled></label>
              <label class="radio-inline isdisabled"><input type="radio" name="${item.columnName}"  value="y1" disabled>y1;</label>
              <label class="radio-inline isdisabled"><input type="radio" name="${item.columnName}"  value="y2" disabled>y2;</label>
              <label class="radio-inline isdisabled"><input type="radio" name="${item.columnName}"  value="x1" disabled>x1;</label>
              <label class="radio-inline isdisabled"><input type="radio" name="${item.columnName}"  value="x2" disabled>x2;</label>
              <label class="radio-inline isdisabled"><input type="radio" name="${item.columnName}"  value="z" disabled>z;</label>
              <label class="radio-inline isdisabled"><input type="checkbox" class="groupFlag" name="${item.columnName}"  value="${item.columnName}" disabled>groupFlag;</label>
              <span class="line-border"></span>
              <select name="${item.columnName}"  class="form-control indicatorFilter">
                <option value="0">筛选条件类型</option>
                <option value="input">输入框</option>
                <option value="select">下拉框</option>
                <option value="select_mul">多选下拉框</option>
                <option value="scope">范围</option>
                <option value="data_filter">定制</option>
              </select>
              <label class="radio-inline labelFilter"></label>
            </div>
            `
          })
          //                <option value="date">日期</option>
          $(".indicator-list form").html(html);
        }
      }
      common.sendAjax(opt);
    },
    //移除指标更变表格事件
    deleteIndicatorToViewtable:function(that){
      delete indicatorData.reportindicatorConfig[$(that).val()];
    },
    groupFlagIndicatorToViewtable:function(that){
      var groupFlag=$(that).is(':checked');
      var val=$(that).val();
      indicatorData.reportindicatorConfig[val].groupFlag=groupFlag==true?1:0;
      $.reportGtstar.indicatorToViewtable();
    },
    updateIndicatorToViewtable:function(that){
      var columnalias=$(that).val();
      var val=$(that).parent().parent().find(".isCheck").val();
      indicatorData.reportindicatorConfig[val].indicatorAlias=columnalias;
      $.reportGtstar.indicatorToViewtable();
    },
    //类型更新指标信息数据
    renewIndicatorToViewtable:function(that){
      var indicatorname=$(that).attr("name");
      var columnalias=$(that).parent().siblings(".isdisabled").children().val();
      var indicatorType=$(that).val();
      var val=$(that).parent().parent().find(".isCheck").val();
      if(indicatorType=="y1"||indicatorType=="y2"||indicatorType=="x2"){
        $(that).parent().parent().find(".groupFlag").prop("checked","checked").attr("disabled","disabled");
      }else if(indicatorType=="z"){
        $(that).parent().parent().find(".groupFlag").prop("checked",false).attr("disabled","disabled");
      }
      else{
        $(that).parent().parent().find(".groupFlag").removeAttr("disabled").prop("checked",false);
      }
      var groupFlag=$(that).parent().parent().find(".groupFlag").is(':checked')==true?1:0;
      indicatorData.reportindicatorConfig[val]={'indicatorName':indicatorname,'indicatorAlias':columnalias,'indicatorType':indicatorType,"groupFlag":groupFlag};
      $.reportGtstar.indicatorToViewtable();
    },
    //指标到视图的方法
    indicatorToViewtable:function(){
      var titleText=$("#reportAlias").val()||$("#reportName").val();
      // console.log(indicatorData);
      if(indicatorData.length<2){
        $(".Viewtable").html("<p style='color:#EA4335'>无法预览,选中的指标项过少</p>");
        return;
      }
      var y1len=0,y2len=0,x1len=0,x2len=0,zlen=0,alllen=0,isallgroup=true,isonegroup=false,isRightConfig=true,message="";
      var html="",y1body="",x1body="",x2body="",zbody="",y2body="";
      //计算各种指标类型的个数
      $.each(indicatorData.reportindicatorConfig,function(index,item){
        if(item.indicatorType==="y1"){
          y1len+=1;
        }else if(item.indicatorType==="x1"){
          x1len+=1;
          if((!item.groupFlag)&&isallgroup){
            isallgroup=false;
          }
          if(item.groupFlag&&(!isonegroup)){
            isonegroup=true;
          }
        }else if (item.indicatorType==="z"){
          zlen+=1;
        }else if(item.indicatorType==="y2"){
          y2len+=1;
        }else if(item.indicatorType==="x2"){
          x2len+=1;
        }
      })
      //设置层次
      $.reportConfigData['rowLevel']=1;
      $.reportConfigData['colLevel']=1;
      if(x2len>0){
        $.reportConfigData['rowLevel']=2;
      }
      if(y2len>0){
        $.reportConfigData['colLevel']=2;
      }
      //把不同指标分类存放不同的DOM位置
      $.each(indicatorData.reportindicatorConfig,function(index,item){
        if(item.indicatorType==="y1"){
          y1body+=`<th style="width:4%">${item.indicatorAlias}</th>`;
        }else if(item.indicatorType==="x1"){
          x1body+=`<th colspan="${x2len}">${item.indicatorAlias}</th>`;
        }else if (item.indicatorType==="z"){
          let colspan;
          if(x2len==0){
            colspan=x1len;
          }else{
            colspan=x1len*x2len;
          }
          zbody=`<th colspan="${colspan}">${item.indicatorAlias}</th>`;
        }else if(item.indicatorType==="y2"){
          y2body+=`<th style="width:6%">${item.indicatorAlias}</th>`;
        }else if(item.indicatorType==="x2"){
          x2body+=`<th>${item.indicatorAlias}</th>`;
        }
      })
      alllen=y1len+y2len+x1len+x2len+zlen;
      //配置错误时,提示信息;以及错误的条件添加
      if(y1len===0){
        // console.log("错误类型1");
        isRightConfig=false;
        message="缺少y1项指标";
      }else if((x2len>0&&x1len<1)||(y1len>0&&x1len==0)){
        // console.log("错误类型2");
        isRightConfig=false;
        message="缺少x1项指标";
      }else if(isallgroup&&(zlen==0)){
        // console.log(isallgroup);
        // console.log("错误类型3");
        isRightConfig=false;
        message="缺少z项指标";
      }else if((!isallgroup)&&(zlen>0)){
        // console.log("错误类型4");
        isRightConfig=false;
        message="错误配置,不能设置z指标类型,请设置其他指标都分组或者取消设置z指标类型";
      }else if(y1len>1){
        // console.log("错误类型5");
        isRightConfig=false;
        message="错误配置,不能设置多个y1类型";
      }else if(y2len>1){
        // console.log("错误类型6");
        isRightConfig=false;
        message="错误配置,不能设置多个y2类型";
      }else if(zlen>1){
        // console.log("错误类型7");
        isRightConfig=false;
        message="错误配置,不能设置多个z类型";
      }else if(x2len>1){
        // console.log("错误类型8");
        isRightConfig=false;
        message="错误配置,不能设置多个x2类型";
      }else if(isonegroup&&(x1len>1)){
        // console.log("错误类型9");
        isRightConfig=false;
        message="错误配置,x1分组时,不能设置多个x1类型";
      }else if(indicatorData['length']!=alllen){
        // console.log("错误类型10");
        isRightConfig=false;
        message="错误配置,有指标选中未选择类型";
      }

      //isRightConfig为正确配置时,做表格显示事件 或者提示错误信息
      if(isRightConfig){
          html=`<h4>${titleText}</h4>
               <table class='table table-bordered table-condensed'>
                <thead>
                   <tr><th colspan="${y2len+1}">&nbsp&nbsp</th>${x1body}</tr>
                   <tr>${y1body}${y2body}`;
        if(x2len>0){
          for(var j=0;j<x1len;j++){
            html+=`${x2body}`
          }
          if(isallgroup){
            html+=`</tr><tr><th colspan="${y1len+y2len}">&nbsp;</th>${zbody}`;
          }
        }else if(x2len==0){
          if(isallgroup){
            html+=`${zbody}`;
          }else{
            for(var i=0;i<x1len;i++){
              html+=`<th>&nbsp;&nbsp;</th>`
            };
          }
        }
        html+=`</tr></thead></table>`;
        $(".Viewtable").html(html);
        $("button[name='setConfig']").removeClass("disabled");
      }else{
        $(".Viewtable").html("<p style='color:#EA4335'>"+message+"</p>");
        $("button[name='setConfig']").addClass("disabled");
      }
      // console.log("y1:"+y1len+"  y2:"+y2len+"  x1:"+x1len+"  x2:"+x2len+"  z:"+zlen);
    },
    //重置缓存的配置表全局数据
    restreportConfigData:function(){
      for(var key in $.reportConfigData){
                  if(typeof $.reportConfigData[key]=="String"){
                    $.reportConfigData[key]="";
                  }else if($.reportConfigData[key] instanceof Array){
                    $.reportConfigData[key]=[];
                  }
      }
       indicatorData={
        length:0,
        reportindicatorConfig:{}
      };
    },
    //配置表提交事件
    setConfig:function(){
      if($("button[name='setConfig']").hasClass("disabled")){
        // console.log("disabled进行判断");
        return;
      }

      if(!exportopts.istrue){
        alert("导出命名格式设置错误,请检查数据");
        return;
      }

      //参考用的 以后要删掉
      // var reportName;//表名
      // console.log(Verification);
      if(Verification.reportName===false||Verification.reportAlias===false){
        // console.log("Verification is false");
        alert("提交失败,请检查数据");
        return;
      }
      $.reportConfigData['reportName']=$("#reportName").val();
      var regu = "^[ ]+$";
      var re = new RegExp(regu);
      var reportName=$("#reportName").val();
      var reportAlias=$("#reportAlias").val();
      // console.log($.reportConfigData['reportName']);
      // console.log("reportName="+reportName);
      // console.log("reportAlias="+reportAlias);
      if(!$.reportConfigData['reportName']){
        // console.log("进来了");
        alert("提交失败,报表名不能为空");
        return;
      }else if(re.test(reportName)||reportName.replace('\s+', '').length==0){
        alert("提交失败,报表名不能全为空格");
        return;
      }
      // var reportAlias;//表别名
      $.reportConfigData['reportAlias']=$("#reportAlias").val()||"";
      // var viewType;//显示类型 0图表 1图 2表
      $.reportConfigData['viewType']=parseInt($("input[name='reportView']:checked").val());
      // var defaultCharts;//默认显示类型"bar"
      if($.reportConfigData['viewType']==2){
        $.reportConfigData['defaultCharts']="";
      }else{
        $.reportConfigData['defaultCharts']=$("input[name='chartView']:checked").val();
      }
      // var tableIds;//关联基础表文本
      $.reportConfigData['tableIds']=$("#selectReport").find("option:selected").attr("data-reportName");
      // var enableFlag;//默认启用 1
      $.reportConfigData['enableFlag']=1;
      // var exportFormat;//导出格式 "" 或1:excel
      // $.reportConfigData["exportFormat"]=$("input[name='export']:checked").val()||1;
       $.reportConfigData["exportFormat"]=$("input[name='export']:checked").val();
      //  var exportTitleFormat=[];
      if($.reportConfigData["exportFormat"]==="1"){
        $.reportConfigData["exportTitleFormat"]=exportopts.exportTitleFormat.join("|");
      }else{
        $.reportConfigData["exportTitleFormat"]='';
      }
      //________________________________分隔,上面不变,下面的数据要修改
    //  $.reportConfigData['filter']=$.reportConfigData['filter']||[];
      var filterList=[];
      var indicatorList=[];
      //收集筛选条件数据
      var getFilters={
                      state:true,
                      name:""
                    };
      $.each($(".indicatorFilter"),function(index,item){
        var filter={
          'field':"",
          "label":"",
          "value":"",
          "placeholder":"",
          "type":""
        };
        var indicatorFilter=$(item).val();
        if (indicatorFilter!=0){
          filter.type=indicatorFilter;
          filter.field=$(item).attr("name");
          filter.label=$(item).siblings(".isdisabled").children().val();
          if(indicatorFilter=="input"){
            filter.placeholder=$(item).next().children().val();
          }else if(indicatorFilter=="data_filter"){
            // console.log("获取custom数据");
            if(filter.field==="neid"){
              var nidfilters=[];
              $('#nidmultiple option:selected').map(function(a, item){return nidfilters.push(item.value);});
              // var idname=[];
              // $('#nidmultiple option:selected').map(function(a, item){return idname.push(item.text);});
              // console.log(idname);
              // console.log(nidfilters);
              filter.value=nidfilters.join(",");
            }else{
              filter.value=$(item).siblings(".labelFilter").children("input[type='text']").val();
            }
            // console.log(filter.value);
            if(filter.value){
              if($(item).siblings(".labelFilter").children(".custom").is(':checked')){
                // console.log("被中了");
                filter.placeholder=true;
                var customfilter={
                  'field':filter.field,
                  "label":filter.label,
                  "value":filter.value,
                  "placeholder":"",
                  "type":""
                };
                // if($(item).siblings(".labelFilter").children("select").val()){
                if(filter.field==="neid"){
                  customfilter.type='select_mul';
                }else{
                  var strs=filter.value.split(",");
                  if(strs.length>1){
                      customfilter.type='select_mul';
                  }else{
                      customfilter.type='input';
                      customfilter.placeholder=filter.value;
                  }
                }
                filterList.push(customfilter);
              }else{
                filter.placeholder=false;
              }
            }else {
              getFilters.state=false;
              getFilters.name=$(item).attr("name");
              return
            };
          }
          else{
            filter.value=$(item).next().children().val()||"";
          }
          filterList.push(filter);
        }
      });
      if(!getFilters.state){
        var mgs=$("input[data-indicatorname="+getFilters.name+"]").attr("data-columnalias");
        alert(mgs+"筛选条件为定制,内容不能为空,请检查数据!");
        return;
      };
      $.reportConfigData['filter']=filterList;

      $.each(indicatorData.reportindicatorConfig,function(index,item){
        $.reportConfigData.reportIndicatorConfig.push(item);
      })
      // $.reportConfigData.reportIndicatorConfig =indicatorList;
       if(!$.reportConfigData.reportId){
         var opt={
            "url":common.getbaseUrl()+"reportConfigs/",
            "methed":"post",
            "data":JSON.stringify($.reportConfigData),
            "contentType":"application/json",
            "async":"",
            callback:function(){
              alert("配置成功");
              location.replace(location.href);
              //  top.location.href="http://192.168.43.54:8080/SINMS/index.do";
            }
          }
          // console.log('新增');
       }else {
         var opt={
            "url":common.getbaseUrl()+"reportConfigs/"+$.reportConfigData.reportId,
            "methed":"put",
            "data":JSON.stringify($.reportConfigData),
            "contentType":"application/json",
            "async":"",
            callback:function(){
              alert("修改成功");
               location.replace(location.href);
              //  top.location.href="http://192.168.43.54:8080/SINMS/index.do";
            }
          }
          // console.log("修改");
       }
        common.sendAjax(opt);
        // console.log($.reportConfigData);
    }
  });
  // $.extend($.reportGtstar{})此处代码结束
  //选择基础报表事件
 $("#selectReport").on('change',function(){
     var rID=parseInt($(this).val());
    //  console.log(rID);
     if(rID!==0){
        $.reportGtstar.restreportConfigData();
       $.reportGtstar.getcolumnsByreportId(rID);
      //  console.log($.reportConfigData.reportId);
       if($.reportConfigData.reportId){
         //获取指标
         var optindicators={
             "url":common.getbaseUrl()+"reportConfigs/"+$.reportConfigData.reportId+"/indicators",
             "async":true,
             callback:function(data){
               if(data){
                //  console.log(data);
                 $.each(data,function(index,item){
                   $(".indicator-list .isCheck[value='"+item.indicatorName+"']").prop("checked",true);
                   $(".indicator-list .isCheck[value='"+item.indicatorName+"']").trigger("change");
                   $(".indicator-list [data-indicatorname='"+item.indicatorName+"']").val(item.indicatorAlias).attr("data-columnalias",item.indicatorAlias);
                   $(".indicator-list [data-indicatorname='"+item.indicatorName+"']").trigger("change");
                   $(".indicator-list input:radio[name='"+item.indicatorName+"'][value='"+item.indicatorType+"']").prop("checked",'checked');
                   $(".indicator-list input:radio[name='"+item.indicatorName+"'][value='"+item.indicatorType+"']").trigger("change");
                   if(item.indicatorType=="x1"){
                     if(item.groupFlag){
                         $(".indicator-list .groupFlag[value='"+item.indicatorName+"']").prop("checked",true);
                         $(".indicator-list .groupFlag[value='"+item.indicatorName+"']").trigger("change");
                     }
                   }
                 })
               }
              //  console.log("完成条件渲染");
             }
           }
           common.sendAjax(optindicators);
           //获取筛选条件
           var optfilters={
               "url":common.getbaseUrl()+"reportConfigs/"+$.reportConfigData.reportId+"/filters",
               "methed":"get",
               "async":true,
               callback:function(data){
                   if(data){
                       $.each(data,function(index,item){
                         $(".indicator-list select[name='"+item.field+"']").find("option[value='"+item.type+"']").prop("selected",true);
                         $(".indicator-list select[name='"+item.field+"']").trigger("change");
                         if(item.type==="data_filter"){
                           if(item.field==="neid"){
                             $("#nidmultiple").multiselect("select",item.value.split(","));
                           }else{
                             $(".indicator-list select[name='"+item.field+"']").next("label").children('input').val(item.value);
                           }
                         }else{
                           var v=item.value?item.value:item.placeholder
                            $(".indicator-list select[name='"+item.field+"']").next("label").children('input').val(v);
                         }
                        //  if(item.value){
                        //      if(item.field==="neid"){
                        //        $("#nidmultiple").multiselect("select",item.value.split(","));
                        //      }else{
                        //        $(".indicator-list select[name='"+item.field+"']").next("label").children('input').val(item.value);
                        //      }
                        //  }
                         if(item.placeholder=="true"){
                           if(item.type==="data_filter"){
                          //    $(".indicator-list select[name='"+item.field+"']").next("label").children('input').val(item.placeholder);
                          //  }else{
                             $(".indicator-list select[name='"+item.field+"']").next("label").children("input[type='checkbox'][name="+item.field+"]").prop('checked',true);
                           }
                         }
                       })
                      //  console.log("完成筛选渲染");
                   }
               }
             };
         common.sendAjax(optfilters);
       }
      $("button[name='setConfig']").addClass("disabled");
      $(".Viewtable").html("");
     }else{
       $("button[name='setConfig']").addClass("disabled");
       $(".indicator-list .form-inline").html("");
       $(".Viewtable").html("");
     }
 });
 //导出格式类型的监听事件
 $(".exportoptdiv").on("change",".exportopt",function(){
  //  var exportopts={
  //    "exportTitleFormat":[],
  //    "istrue":true
  //  }
   if(exportopts.isfirst){
     return;
   }
   if($(this).attr("data-index")=="1"||$(this).attr("data-index")=="3"||$(this).attr("data-index")=="5"){
     if($(this).val()==="0"){
        exportopts.exportTitleFormat[$(this).attr("data-index")]="";
        if($(this).attr("data-index")=="5")exportopts.exportTitleFormat[6]="";
     }else{
       exportopts.exportTitleFormat[$(this).attr("data-index")]=$(this).children("option:selected").text();
     }
   }else{
     exportopts.exportTitleFormat[$(this).attr("data-index")]=$(this).val();
   }
  //  console.log(exportopts.exportTitleFormat);
   var reg=new RegExp("[\\\\/:\\*\\?\\\"<>\\|]");
   var exportsult=exportopts.exportTitleFormat.join("");
   if(exportsult.length===0){
     exportsult="";
   }else{
     exportsult+=".后缀名";
     exportsult=$.trim(exportsult);
   }
   if(reg.test(exportsult)){
     exportopts.istrue=false;
     $("#exportpreview").prop("value","文件名不能包含\/\\:\*\?\"<>\|任一字符")
                        .prop("style","color:red");
   }else{
     exportopts.istrue=true;
     $("#exportpreview").prop("value",exportsult)
                        .removeAttr("style");
   }

 })
 //配置报表的筛选类型事件
$(".indicator-list form").on("change",".indicatorFilter",function(){
 var option=$(this).val();
 var indicatorname=$(this).attr("name");
 // console.log(indicatorname);
 var html="";
 if(option==="0"){
   html="";
 }else if(option==="input"){
   html=`输入提示信息:<input class="form-control" type="text" style="width:150px" >`
 }else if(option==="select"||option==="select_mul"){
   html=`输入选择以","逗号分隔:<input class="form-control" maxlength="255" style="width:100px" type="input">`
 }else if(option==="data_filter"){
  //  console.log("option进行判断了");
   if(indicatorname=="neid"){
    //  console.log("等于neid");
     var opt={
       "url":common.getbaseUrl()+"nes/",
       "methed":"get",
       "data":"",
       "contentType":"application/json",
       "async":false,
       callback:function(data){
          var _html="请选择值:<select class='form-control' multiple='multiple' id='nidmultiple'>";
         $.each(data,function(index,item){
           _html+=`<option value='${item.id}' data-name='${item.neName}'>${item.neName}</option>`;
         });
          _html+=`</select>&nbsp;&nbsp;是否页面显示:&nbsp;&nbsp;<input type='checkbox' class='custom' name=${indicatorname} />`;
          html=_html;
       },
       error:function(){
         alert("未查询到分配的网元,无法设置该筛选条件");
       },
     };
      common.sendAjax(opt);
   }else{
     //做不是网元ID的处理
    //  console.log("不是网元");
     html+=`输入选择以","逗号分隔:<input class="form-control" type="text" style="width:150px" name=${indicatorname} > &nbsp;&nbsp;是否页面显示:&nbsp;&nbsp;<input type='checkbox' name=${indicatorname} class='custom'/>`
   }
 }
 $(this).next("label").html(html);
 $("#nidmultiple").multiselect({
   buttonWidth: '150px',
   disableIfEmpty: true,//没有选项时readonly
   disabledText: '没有选择',//disabled时显示的文字说明
   allSelectedText: '全选',//所有被选中的时候 全选（n）
   numberDisplayed:1,
   nSelectedText: '个被选中',
   enableFiltering: true,
   includeSelectAllOption: true,
   selectAllJustVisible: false,
 });
})
//指标选中事件
$(".indicator-list" ).on("change",".isCheck",function(){
  var isCheck=!$(this).prop("checked");
  var columnAlias=$(this).parent().next().children('input').attr('data-columnAlias');
  var columnName=$(this).attr("name");
  var val=$(this).val();
  $(this).toggleClass("checked").parent().siblings(".isdisabled").children().prop("disabled",isCheck);
  //保存每个指标前checkbox被选中的个数
  indicatorData.length=$(".indicator-list .isCheck").filter(".checked").length;
  //取消了选择指标,恢复别名,取消类型选择,即删除样式表中该行的显示;
  if(isCheck){
    $(this).parent().next().children('input')[0].value=columnAlias;
    $("input[type='radio'][name='"+columnName+"']").prop("checked",false);
    var that=$(this);
    $(this).parent().parent().find('.groupFlag').prop("checked",false);
    $.reportGtstar.deleteIndicatorToViewtable(that);
  }else {
    indicatorData.reportindicatorConfig[val]={};
  }
      $.reportGtstar.indicatorToViewtable();
})

$(".indicator-list").on("change","input[type='radio']",function(){
   var that=$(this);
  $.reportGtstar.renewIndicatorToViewtable(that);
})
$(".indicator-list").on("change","input[type='text'].indicatorName",function(){
    var that=$(this);
    $.reportGtstar.updateIndicatorToViewtable(that);
})
$(".indicator-list").on("change",".groupFlag",function(){
    var that=$(this);
    $.reportGtstar.groupFlagIndicatorToViewtable(that);
})
$("#addReport").on("change","input[name='export']",function(){
    if($(this).val()==="1"){
      $("div.exportoptdiv").show();
    }else{
      $("div.exportoptdiv").hide();
      exportopts={
        "exportTitleFormat":[],
        "istrue":true
      }
      $(".exportopt").prop("value","");
      $("#exportopt1 option[value='0']").prop("selected",true);
      $("#exportopt2 option[value='0']").prop("selected",true);
      $("#exportopt3 option[value='0']").prop("selected",true);
      $("#exportopt1").trigger("change");
    }
})
//导出类型的设置
//exportTitleFormat
$("#addReport").on("change","#exportopt1",function(){
  if($(this).val()>0){
    $("#exportopt2").prop("disabled",false);
    $("#exportopt2 option[value='"+$(this).val()+"']").prop("style","display:none").siblings("option[value!='0']").removeAttr("style");
    $("div.Connectordiv2 input").prop("disabled",false);
  }else{
    $("#exportopt2").prop("disabled",true);
    $("div.Connectordiv2 input").prop("value","");
    $("div.Connectordiv2 input").prop("disabled",true);
    if(!exportopts.isfirst){
      exportopts.exportTitleFormat[2]="";
    }
  }
  $("#exportopt2 option[value='0']").prop("selected",true);
  if(!exportopts.isfirst){
      exportopts.exportTitleFormat[3]="";
  }
  $("#exportopt2").trigger("change");
})
$("#addReport").on("change","#exportopt2",function(){
  // console.log("2"+$(this).val());
  if($(this).val()>0){
    $("#exportopt3").prop("disabled",false);
    $("#exportopt3 option[value='"+$(this).val()+"']").prop("style","display:none").siblings("option[value!='0']").removeAttr("style");
    $("#exportopt3 option[value='"+$("#exportopt1").val()+"']").prop("style","display:none");
    $("div.Connectordiv3 input").prop("disabled",false);
  }else{
    $("#exportopt3").prop("disabled",true);
    $("div.Connectordiv3 input").prop("disabled",true);
    $("div.Connectordiv3 input").prop("value","");
    if(!exportopts.isfirst){
      exportopts.exportTitleFormat[4]="";
    }
    // $("div.Connectordiv4 input").prop("disabled",true);
    // $("div.Connectordiv4 input").prop("value","");
  }
  $("#exportopt3 option[value='0']").prop("selected",true);
  if(!exportopts.isfirst){
    exportopts.exportTitleFormat[5]="";
  }
  $("#exportopt3").trigger("change");
})
$("#addReport").on("change","#exportopt3",function(){
  if($(this).val()>0){
    $("div.Connectordiv4 input").prop("disabled",false);
  }else{
    $("div.Connectordiv4 input").prop("disabled",true);
    $("div.Connectordiv4 input").prop("value","");
    if(!exportopts.isfirst){
      exportopts.exportTitleFormat[6]="";
      // $(".exportopt").trigger("change");
    }
  }
})

//reportName reportAlias
 $("#reportName").blur(function(){
    var reg=new RegExp("[\\\\/:\\*\\?\\\"<>\\|]");
    var str=$(this).val();
    // console.log(str);
   if(this.validity.valueMissing){
     var msg = '表名不能为空';
     $(this).next().html(msg);
     $(this).next().addClass('danger');
     this.setCustomValidity(msg);
     Verification.reportName=false;
   }else if(reg.test(str)){
    //  console.log("含有非法字符");
     var msg = '不得含有\/\\:\*\?\"<>\|任一字符';
     $(this).next().html(msg);
     $(this).next().addClass('danger');
     this.setCustomValidity(msg);
     Verification.reportName=false;
   }
   else {
     $(this).next().html('');
     $(this).next().removeClass('danger');
     this.setCustomValidity('');
     Verification.reportName=true;
   }
  //  console.log(Verification);
 });
 $("#reportAlias").blur(function(){
   var reg=new RegExp("[\\\\/:\\*\\?\\\"<>\\|]");
   var str=$(this).val();
   if(reg.test(str)){
    //  console.log("含有非法字符");
     var msg = '不得含有\/\\:\*\?\"<>\|任一字符';
     $(this).next().html(msg);
     $(this).next().addClass('danger');
     this.setCustomValidity(msg);
     Verification.reportAlias=false;
   }else{
     $(this).next().html('');
     $(this).next().removeClass('danger');
     this.setCustomValidity('');
     Verification.reportAlias=true;
   };
  //  console.log(Verification);
 });




})(jQuery)
