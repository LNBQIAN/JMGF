﻿var grid;
var gridProcess;
var dialogAdd;
var dialogAddChange;
var gridRepairPlanTable;
var gridRepairPlanTableChange;
var IsRepair;
var dialogPrice;
var HomeMap = null;

var ComponentOpinion;
var AcceptanceResult;///项目主要内容及要求
var PassTime; ///派发任务单时间
//var ConstructionUnit; //施工单位
var IsFinished;///是否完工
var Remark;///备注

var StepSix = 1;
var istaskNo = 1;
var isChangeRepairPlan = 1;///最后一步（修缮结果验收）必须上传验收图片，不上传图片不能进行办理
var IsPassed = 1;///修缮方案是否通过
var isExamination = 1;///是否显示审核
var Acceptance = 1;///是否显示验收


var workFlowInstanceId = $("#workFlowInstanceId").val();
var ActivityInstanceId = $("#actInstanceId").val();
var RepairTaskId = $("#fromInstanceId").val();
var houseId = $("#houseId").val();
MinorRepairEngineeringTransaction = {
    Initialize: function () {
        grid = $('#householdTable').datagrid({
            height: 250,
            striped: true,
            fitColumns: true,
            loadMsg: false,
            singleSelect: true,
            title: "楼栋、分户信息",
            nowrap: false,
            rownumbers: true, //行号
            pageSize: 50,
            pageList: [10, 20, 50, 100],
            showFooter: true,
            columns: [
                [
                    { field: "houseId", title: "房屋Id", hidden: true },
                    { field: "unitId", title: "分户Id", hidden: true },
                    {
                        field: "houseNo",
                        title: "房屋编号",
                        align: "center",
                        width: '12%',
                        formatter: function (value, row, index) {
                            if (value !== null) {
                                return "<a href='#' onclick='objectExtend.HouseBan(" + row.houseId + ")'>" + value + "</a>";
                            }
                            return "";
                        }
                    },
                    { field: "houseDoorplate", title: "现房屋门牌", align: "left", width: '15%' },
                    { field: "streetName", title: "街道名称", align: "center", width: '10%' },
                    { field: "unitName", title: "单元名称", align: "center", width: '15%' },
                   // { field: "unitDoorplate", title: "现房屋门牌", align: "center", width: '10%' },
                    { field: "rentRange", title: "租赁范围", align: "center", width: '14%' },
                    {
                        field: "name",
                        title: "承租人",
                        align: "center",
                        width: '10%',
                        formatter: function (value, row, index) {
                            if (value !== null) {
                                return "<a href='#' onclick='objectExtend.LesseeInfoOpen(" + row.lesseeId + ")'>" + value + "</a>";
                            } else {
                                return "";
                            }
                        }
                    },
                    { field: "contactNumber", title: "联系电话", align: "center", width: '15%' }
                ]
            ]
        });
    },
    Map: null,
    Init: function (args) {
        if (HomeMap != null)
            return;
        HomeMap = new BMap.Map(args.mapid); // 创建Map实例
        HomeMap.addControl(new BMap.NavigationControl()); // 添加平移缩放控件
        HomeMap.addControl(new BMap.ScaleControl()); // 添加比例尺控件
        HomeMap.enableScrollWheelZoom(); //启用滚轮放大缩小
        HomeMap.centerAndZoom(new BMap.Point(113.0418, 22.3550), 11); // 初始化地图,设置中心点坐标和地图级别
        HomeMap.panBy(300, 380);
        HomeMap.setCurrentCity("江门");
    },
    ///获取流程办理信息
    loadData: function (param, success, error) {
        topevery.ajax({
            type: "POST",
            url: "api/services/app/HouseRentApplyR/GetWorkflowInstanceInfo",
            contentType: "application/json",
            data: JSON.stringify({
                FlowInstanceId: workFlowInstanceId,
                ModuleType: 21
            })
        }, function (data) {
            if (data.success) {
                success(data.result);
            } else {
                error();
            }
        }, false);
    },
    ///加载列表数据-
    ProcessInitialize: function () {
        gridProcess = $('#ProcessViewTable').datagrid({
            height: 300,
            striped: true,
            fitColumns: true,
            loadMsg: false,
            singleSelect: true,
            nowrap: false,
            loader: MinorRepairEngineeringTransaction.loadData,
            rownumbers: true, //行号
            pageSize: 50,
            pageList: [10, 20, 50, 100],
            showFooter: true,
            onLoadSuccess: function (data) {
                $(this).datagrid('doCellTip', { 'max-width': '400px', 'delay': 500 });
            },
            columns: [
                [
                    { title: '环节名称', field: 'linkName', width: '120', align: 'center' },
                    { title: '经办人', field: 'agent', width: '100', align: 'center' },
                    {
                        title: '办理时间', field: 'handleTime', width: '150', align: 'center',
                        formatter: function (value) {
                            return topevery.dataTimeFormatTT(value);
                        }
                    },
                   { title: '办理意见', field: 'handleOpinion', width: '100', align: 'center' },
                    {
                        title: '相关附件',
                        field: 'fileRDto',
                        width: '150',
                        align: 'center',
                        formatter: function (data, row, index) {
                            return topevery.ProcessAttachment(data);
                        }
                    }
                ]
            ]
        });
    },
    ///获取基本信息，赋值到文本框
    EssentialInformation: function () {
        topevery.ajax({
            type: "POST",
            url: "api/services/app/RepairTaskR/GetHouseTenantBasicInfo",
            contentType: "application/json",
            data: JSON.stringify({ id: RepairTaskId }) //$("#RepairTaskId").val() })
        }, function (row) {
            if (row.success) {
                var data = row.result;
                $("#ApplyReason").textbox("setValue", data.applyReason);
                var param = { mapid: "allmap" };
                MinorRepairEngineeringTransaction.Init(param);
                if (data.hbBasicInfoOutPutDtos != null) {
                    for (var i = 0; i < data.hbBasicInfoOutPutDtos.length; i++) {
                        $('#householdTable').datagrid('insertRow', { index: i, row: data.hbBasicInfoOutPutDtos[i] });
                        var point = new BMap.Point(parseFloat(data.hbBasicInfoOutPutDtos[i].longitude), parseFloat(data.hbBasicInfoOutPutDtos[i].latitude));
                        var marker = new BMap.Marker(point); // 创建标注
                        HomeMap.addOverlay(marker); // 将标注添加到地图中
                    }
                }
            } else {
                error();
            }
        }, true);
    },
    ///获取办理信息
    Initializecc: function (id) {
        topevery.ajax({
            type: "POST",
            url: "api/services/app/RepairTaskR/GetRepairLargeAndMediumHandleInfo",
            contentType: "application/json",
            data: JSON.stringify({
                "ActivityInstanceId": ActivityInstanceId,
                "RepairTaskId": RepairTaskId,
                "FlowInstanceId": workFlowInstanceId,
                "HouseId": houseId
            })
        }, function (row) {
            if (row.success) {
                var data = row.result;
                $("#InUserName").html("[" + data.inUserName + "]" + topevery.dataTimeFormatTT(data.inDate));
                $("#ComponentOpinion").html(data.componentOpinion);
                ComponentOpinion = data.componentOpinion;
                $("#CurrentLink").html(data.currentLink);
                $("#NextLink").html(data.nextLink);
                $("#ReceiveObject").html(data.receiveObject);
                $("#Timeout").html(data.timeout);
                // $("#AddRepairPlan").hide();
                //$("#AddProjectPrice").hide();
                //$("#RepairPlanTable").hide();
                if (data.isUpload === 2) {
                    // $("#AddRepairPlan").show();
                    //   $("#AddProjectPrice").show();
                    $($("#MinorRepairTabs").find("li")[1]).show();
                    $($("#MinorRepairTabs").find("li")[2]).hide();
                    $($("#MinorRepairTabs").find("li")[3]).hide();
                    $("#attachment").html("(必须上传上传施工图纸、预算书等,否则不能进行办理!)");
                    $("#attachment").show();
                    IsRepair = true;
                } else {
                    $($("#MinorRepairTabs").find("li")[1]).hide();
                    $($("#MinorRepairTabs").find("li")[2]).hide();
                    $($("#MinorRepairTabs").find("li")[3]).hide();
                }
                if (data.isUpload === 3) {
                    //$("#AddRepairPlan").hide();
                    // $("#AddProjectPrice").hide();
                    //  $("#RepairPlanTable").datagrid('hideColumn', "Action");
                    $($("#MinorRepairTabs").find("li")[1]).show();
                    $("#StartTime").attr("disabled", "disabled");
                    $("#EndTime").attr("disabled", "disabled");

                }
                if (data.isUpload === 4) {
                    // $("#AddRepairPlan").hide();
                    // $("#AddProjectPrice").hide();
                    $($("#MinorRepairTabs").find("li")[1]).show();
                    // $("#RepairPlanTable").datagrid('hideColumn', "Action");
                    $("#StartTime").attr("disabled", "disabled");
                    $("#EndTime").attr("disabled", "disabled");
                }
                if (data.isUpload === 5) {
                    StepSix = 0;
                    // $("#AddRepairPlan").hide();
                    // $("#AddProjectPrice").hide();
                    $($("#MinorRepairTabs").find("li")[1]).show();
                    //    $("#isUnit").show();
                    //$("#ConstructionUnit").combobox({
                    //    required: true,
                    //    editable: false
                    //});
                    // $("#RepairPlanTable").datagrid('hideColumn', "Action");
                    $("#StartTime").attr("disabled", "disabled");
                    $("#EndTime").attr("disabled", "disabled");
                    $("#attachment").html("(必须上传招标书、中标通知书、合同相关文件、投标文件等!)");
                    $("#attachment").show();
                }

                if (data.isUpload === 6) {
                    isChangeRepairPlan = 0;
                    Acceptance = 0;
                    MinorRepairEngineeringTransaction.InitializeRepairPlanChange();
                    //$("#AddRepairPlan").hide();
                    //$("#AddProjectPrice").hide();
                    $($("#MinorRepairTabs").find("li")[1]).show();
                    $($("#MinorRepairTabs").find("li")[2]).show();
                    //$($("#MinorRepairTabs").find("li")[3]).show();
                    //$("#isUnit").show();
                    //$("#ConstructionUnit").combobox({
                    //    required: true,
                    //    editable: false
                    //});
                    //$("#ConstructionUnit").attr("disabled", "disabled");
                    //$("#ConstructionUnit").attr("readonly", "readonly");
                    //$("#ConstructionUnit").combobox("readonly");
                    //  $("#RepairPlanTable").datagrid('hideColumn', "Action");
                    $("#StartTime").attr("disabled", "disabled");
                    $("#EndTime").attr("disabled", "disabled");
                    $("#attachment").html("( 必须上传验收图片，不上传图片不能进行办理!)");
                    $("#attachment").show();

                }
            } else {
                error();
            }
        }, false);
    },
    ///办理提交验证以及数据处理
    TransactionSave: function () {
        var repairItemIdList = "";
        var taskChangeIdList = "";
        ///控制修缮填写验证
        if (IsRepair === true) {
            if ($("#RepairPlan").form('validate') === false) {
                $("#MinorRepairTabs").find("li")[1].click();
                topeveryMessage.show("请录入修缮信息！");
                return;
            } else {
                if ($("#StartTime").val() == null || $("#StartTime").val() === "" || $("#StartTime").val() === undefined) {
                    window.top.topeveryMessage.show("计划开工日期不能为空！");
                    return;
                }
                if ($("#EndTime").val() == null || $("#EndTime").val() === "" || $("#StartTime").val() === undefined) {
                    window.top.topeveryMessage.show("计划完工日期不能为空！");
                    return;
                }
                //var houseRepairArray = $('#RepairPlanTable').datagrid('getRows');
                //for (var i = 0; i < houseRepairArray.length; i++) {
                //    repairItemIdList += houseRepairArray[i].id + "," + houseRepairArray[i].number + "," + houseRepairArray[i].unitNumN + ";";
                //}
            }
            if ($("input[name='IdhiddenFile']").val() === null || $("input[name='IdhiddenFile']").val() === "") {
                window.top.topeveryMessage.show("必须上传上传施工图纸、预算书等,否则不能进行办理！");
                $("#MinorRepairTabs").find("li")[0].click();
                return;
            }
        }
        if (StepSix === 0) {
            if ($("input[name='IdhiddenFile']").val() === null || $("input[name='IdhiddenFile']").val() === "") {
                window.top.topeveryMessage.show("必须上传招标书、中标通知书、合同相关文件、投标文件等！");
                $("#MinorRepairTabs").find("li")[0].click();
                return;
            }
        }

        if (istaskNo === 0) {
            var date = new Date();
            PassTime = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        }
        ///控制是否显示修缮输入内容
        if (Acceptance === 0) {
            if ($("#RepairAcceptance").form('validate') === false) {
                $("#MinorRepairTabs").find("li")[2].click();
                topeveryMessage.show("请补录修缮验收结果！");
                return;
            } else {
                IsFinished = $("#IsFinished").combobox('getValue');
                Remark = $("#Remark").textbox('getValue');
                AcceptanceResult = $("#AcceptanceResult").combobox('getValue');
            }
        }
        //必须上传验收图片，不上传图片不能进行办理！
        if (isChangeRepairPlan === 0) {
            if ($("input[name='IdhiddenFile']").val() === null || $("input[name='IdhiddenFile']").val() === "") {
                window.top.topeveryMessage.show("必须上传验收图片，不上传图片不能进行办理！");
                $("#MinorRepairTabs").find("li")[0].click();
                return;
            }
        }
        //if (isChangeRepairPlan === 0) {
        //    var repairPlanTableChangeArray = $('#RepairPlanTableChange').datagrid('getRows');
        //    for (var h = 0; h < repairPlanTableChangeArray.length; h++) {
        //        taskChangeIdList += repairPlanTableChangeArray[h].id + "," + repairPlanTableChangeArray[h].number + "," + repairPlanTableChangeArray[h].unitNumN + ";";
        //    }
        //}
        ///控制是否显示审批按钮
        if (isExamination === 0) {
            topeveryMessage.confirm(function (r) {
                if (r) {
                    IsPassed = 1;
                    MinorRepairEngineeringTransaction.TransactionSubmit(IsPassed, repairItemIdList, "");
                } else {
                    IsPassed = 0;
                    MinorRepairEngineeringTransaction.TransactionSubmit(IsPassed, repairItemIdList, "");
                }
            }, "是否通过", "请确定(通过),取消(不通过)修缮方案？");
        } else {
            MinorRepairEngineeringTransaction.TransactionSubmit(IsPassed, repairItemIdList, taskChangeIdList);
        }
    },
    //提交办理信息ajax
    TransactionSubmit: function (state, repairItemIdList, taskChangeIdList) {
        topevery.ajax({
            type: "POST",
            url: "api/services/app/RepairTaskW/AddRepLargeAndMediumWfInstAsync",
            contentType: "application/json",
            data: JSON.stringify({
                ActivityInstanceId: ActivityInstanceId,
                Content: $("#Content").val(),
                FileId: $("input[name='IdhiddenFile']").val(),
                FromInstanceId: RepairTaskId,
                RepairItemId: repairItemIdList,
                BudgetMoney: $("#BudgetMoney").textbox('getValue'),
                StartTime: $("#StartTime").val(),
                EndTime: $("#EndTime").val(),
                //ConstructionUnit: $("#ConstructionUnit").combobox('getValue'),
                IsPassed: state,
                AcceptanceResult: AcceptanceResult,
                PassTime: PassTime,
                IsFinished: IsFinished,
                Remark: Remark,
                TaskChangeId: taskChangeIdList
            })
        }, function (data) {
            if (data.success) {
                window.top.topeveryMessage.show("办理成功");
                window.location = virtualDirName + 'Home/TodoLists';
            } else {
                error();
            }
        }, true);
    },
    Cancellation: function () {
        topeveryMessage.confirm(function (r) {
            if (r) {
                topevery.ajax({
                    type: "POST",
                    url: "api/services/app/RepairTaskW/AddRepLargeAndMediumWfInstAsync",
                    contentType: "application/json",
                    data: JSON.stringify({
                        ActivityInstanceId: ActivityInstanceId,
                        Content: $("#Content").val(),
                        FileId: $("input[name='IdhiddenFile']").val(),
                        FromInstanceId: RepairTaskId,
                        //RepairItemId: repairItemIdList,
                        BudgetMoney: $("#BudgetMoney").textbox('getValue'),
                        StartTime: $("#StartTime").val(),
                        EndTime: $("#EndTime").val(),
                        //ConstructionUnit: $("#ConstructionUnit").combobox('getValue'),
                        IsPassed: 1,
                        AcceptanceResult: AcceptanceResult,
                        PassTime: PassTime,
                        IsFinished: IsFinished,
                        Remark: Remark,
                        Obsolete: true
                        //TaskChangeId: taskChangeIdList
                    })
                }, function (data) {
                    if (data.success) {
                        window.top.topeveryMessage.show("操作成功!");
                        window.location = virtualDirName + 'Home/TodoLists';
                    } else {
                        error();
                    }
                }, true);
            }
        }, "", "您确认作废当前业务吗?");
    },
    /////选择修缮方案
    //AddRepairPlan: function () {
    //    var list = $('#RepairPlanTable').datagrid('getRows');
    //    var ids = "";
    //    for (var i = 0; i < list.length; i++) {
    //        ids += list[i].id + "," + list[i].number + "," + list[i].unitNumN + ";";
    //    }
    //    dialogAdd = ezg.modalDialog({
    //        width: 950,
    //        height: 500,
    //        title: '添加修缮方案',
    //        url: virtualDirName + 'HouseRepair/RepairOptions?ids=' + ids + '&type=0',
    //        buttons: [
    //        ]
    //    });
    //},
    ///选择变更修缮方案
    //AddRepairPlanChange: function () {
    //    var list = $('#RepairPlanTableChange').datagrid('getRows');
    //    var ids = "";
    //    for (var i = 0; i < list.length; i++) {
    //        ids += list[i].id + "," + list[i].number + "," + list[i].unitNumN + ";";
    //    }
    //    dialogAddChange = ezg.modalDialog({
    //        width: 950,
    //        height: 500,
    //        title: '变更修缮方案',
    //        url: virtualDirName + 'HouseRepair/RepairOptions?ids=' + ids + '&type=1',
    //        buttons: [
    //        ]
    //    });
    //},
    //手动录入修缮方案
    //EngineeringSettlementPrice: function (type) {
    //    dialogPrice = ezg.modalDialog({
    //        width: 650,
    //        height: 370,
    //        title: '手动录入修缮方案',
    //        url: virtualDirName + "HouseRepair/HouseRepairAdd?type=" + type,
    //        buttons: [
    //            {
    //                text: '确认',
    //                iconCls: 'icon-ok',
    //                handler: function () {
    //                    dialogPrice.find('iframe').get(0).contentWindow.submitFormAdd(dialogPrice, grid, this);
    //                }
    //            }
    //        ]
    //    });
    //},
    ///打印施工任务单
    Print: function () {
        window.open(virtualDirName + "PrintRelevant/ConstructTaskSheet?id=" + RepairTaskId + "&type=" + ComponentOpinion);
    },
    ///加载修缮方案列表
    InitializeRepairPlan: function () {
        gridRepairPlanTable = $('#RepairPlanTable').datagrid({
            height: 350,
            striped: true,
            fitColumns: true,
            loadMsg: false,
            singleSelect: true,
            nowrap: false,
            rownumbers: true, //行号
            pageSize: 50,
            pageList: [10, 20, 50, 100],
            showFooter: true,
            onLoadSuccess: function (data) {
                $(this).datagrid('doCellTip', { 'max-width': '400px', 'delay': 500 });
            },
            loader: MinorRepairEngineeringTransaction.loadDataRepairPlan,
            columns: [
                [
                    { field: "id", title: '编号', hidden: true },
                    {
                        title: '操作',
                        field: 'Action',
                        width: '7%',
                        align: 'center',
                        formatter: function (value, row, index) {
                            var e = '<a href="#" class="easyui-modifyoperate" onclick="MinorRepairEngineeringTransaction.Delete(' + index + ',' + row.unitPriceY + ',' + row.number + ')">删除</a> ';
                            return e;
                        }
                    },
                    { title: '定额号', field: 'quotaNo', width: '10%', align: 'center' },
                    { title: '工程小类', field: 'repairCate', width: '12%', align: 'center' },
                    { title: '工程大类', field: 'repairTypeId', width: '12%', align: 'center', hidden: true },
                    { title: '工程大类', field: 'repairTypeName', width: '9%', align: 'center' },
                    { title: '单位', field: 'unit', width: '7%', align: 'center' },
                    { title: '单价(有住户)', field: 'unitPriceY', width: '12%', align: 'center' },
                    { title: '有住户数量', field: 'number', width: '8%', align: 'center' },
                    { title: '单价(空置房)', field: 'unitPriceN', width: '12%', align: 'center' },
                    { title: '空置房数量', field: 'unitNumN', width: '12%', align: 'center' }
                ]
            ]
        });
    },
    ///加载修缮变更方案列表
    InitializeRepairPlanChange: function () {
        gridRepairPlanTableChange = $('#RepairPlanTableChange').datagrid({
            height: 350,
            striped: true,
            fitColumns: true,
            loadMsg: false,
            singleSelect: true,
            nowrap: false,
            rownumbers: true, //行号
            pageSize: 50,
            pageList: [10, 20, 50, 100],
            showFooter: true,
            onLoadSuccess: function (data) {
                $(this).datagrid('doCellTip', { 'max-width': '400px', 'delay': 500 });
            },
            columns: [
                [
                    { field: "id", title: '编号', hidden: true },
                    {
                        title: '操作',
                        field: 'Action',
                        width: '8%',
                        align: 'center',
                        formatter: function (value, row, index) {
                            var e = '<a href="#" class="easyui-modifyoperate" onclick="MinorRepairEngineeringTransaction.DeleteChange(' + index + ',' + row.unitPriceY + ',' + row.number + ')">删除</a> ';
                            return e;
                        }
                    },
                    { title: '定额号', field: 'quotaNo', width: '10%', align: 'center' },
                    { title: '工程小类', field: 'repairCate', width: '12%', align: 'center' },
                    { title: '工程大类', field: 'repairTypeId', width: '12%', align: 'center', hidden: true },
                    { title: '工程大类', field: 'repairTypeName', width: '9%', align: 'center' },
                    { title: '单位', field: 'unit', width: '7%', align: 'center' },
                    { title: '单价(有住户)', field: 'unitPriceY', width: '12%', align: 'center' },
                    { title: '有住户数量', field: 'number', width: '8%', align: 'center' },
                    { title: '单价(空置房)', field: 'unitPriceN', width: '12%', align: 'center' },
                    { title: '空置房数量', field: 'unitNumN', width: '12%', align: 'center' }
                ]
            ]
        });
    },
    ///获取修缮项目
    loadDataRepairPlan: function (param, success, error) {
        topevery.ajax({
            type: "POST",
            url: "api/services/app/RepairTaskR/GetRepairTaskRepItemInfoAsync",
            contentType: "application/json",
            data: JSON.stringify({
                id: RepairTaskId //$("#FromInstanceId").val()
            })
        }, function (data) {
            if (data.success) {
                $("#BudgetMoney").textbox('setValue', data.result.budgetMoney);
                if (data.result.startTime != null)
                    $("#StartTime").val(topevery.dataTimeFormat(data.result.startTime));
                if (data.result.endTime != null)
                    $("#EndTime").val(topevery.dataTimeFormat(data.result.endTime));
                $("#PassTime").datebox('setValue', data.result.passTime);
                //$("#ConstructionUnit").combobox('setValue', data.result.constructionUnit);
                $("#IsFinished").combobox('setValue', data.result.isFinished);
                $("#ContentAndDemand").textbox('setValue', data.result.contentAndDemand);
                $("#Remark").textbox('setValue', data.result.remark);
                success(data.result.repairItemList);
            } else {
                error();
            }
        }, false);
    },
    ///删除单个修缮项目，同时同步修缮预算
    //Delete: function (id, unitPriceY, number) {
    //    $('#RepairPlanTable').datagrid('deleteRow', id);
    //    var list = $('#RepairPlanTable').datagrid('getRows');
    //    $('#RepairPlanTable').datagrid('loadData', { total: 0, rows: [] });
    //    for (var i = 0; i < list.length; i++) {
    //        $('#RepairPlanTable').datagrid('insertRow', { index: i, row: list[i] });
    //    }
    //    $("#BudgetMoney").textbox('setValue', ($("#BudgetMoney").textbox('getValue') - unitPriceY * number).toFixed(2));
    //},
    ///删除单个修缮项目
    //DeleteChange: function (id, unitPriceY, number) {
    //    $('#RepairPlanTableChange').datagrid('deleteRow', id);
    //    var list = $('#RepairPlanTableChange').datagrid('getRows');
    //    $('#RepairPlanTableChange').datagrid('loadData', { total: 0, rows: [] });
    //    for (var i = 0; i < list.length; i++) {
    //        $('#RepairPlanTableChange').datagrid('insertRow', { index: i, row: list[i] });
    //    }
    //}
}
///扩展方法
function bindDropDown(btnid, url, defaultText, required, lastDefault) {
    $("#" + btnid).combobox({
        editable: false,
        url: virtualDirName + url,
        loadFilter: function (data) {
            var data = $.treeMap(data, function (row) {
                return {
                    value: row.Data.Key,
                    text: row.Data.Value
                };
            });
            if (lastDefault) {
                data[0].selected = true;
            }; $(document).dequeue("datagrid0102");
            // 添加空行
            if (defaultText !== "") {
                if ($.isArray(data)) {
                    data.splice(0, 0, { value: "", text: defaultText });
                }
            }
            return data;
        },
        required: required ? true : false
    });
}
///初始化数据
$(function () {
    //由于存在下拉赋值不了的问题，所以这里用的序列
    //$(document).queue("datagrid0101", function () { bindDropDown("ConstructionUnit", "Common/GetEngineerUnitAllAsync", "", false); });
    $(document).queue("datagrid0101", function () { InitializeZZ(); });
    $(document).dequeue("datagrid0101");
});

function InitializeZZ() {
    MinorRepairEngineeringTransaction.Initialize();
    MinorRepairEngineeringTransaction.EssentialInformation();
    MinorRepairEngineeringTransaction.ProcessInitialize();
    MinorRepairEngineeringTransaction.Initializecc($("#actInstanceId").val());
    MinorRepairEngineeringTransaction.InitializeRepairPlan();
    MinorRepairEngineeringTransaction.loadDataRepairPlan();
}