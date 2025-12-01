/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/stream-deck.js" />

const DoorAction = new Action('de.blackmautz.telemetry.all.dooraction');
const CashAction = new Action('de.blackmautz.telemetry.all.changeaction');
const GearSwitchAction = new Action('de.blackmautz.telemetry.all.gearselect');
const IgnitionAction = new Action("de.blackmautz.telemetry.all.ignition");
const CustomAction = new Action('de.blackmautz.telemetry.all.customaction');
const SaleStatus = new Action('de.blackmautz.telemetry.all.paymentstatus');
const StartOptionAction = new Action('de.blackmautz.telemetry.all.start');
const ConnectionStatus = new Action('de.blackmautz.telemetry.all.constatus');
const IndicatorControl = new Action('de.blackmautz.telemetry.all.indicatorcontrol');
const CustomButtonAction = new Action('de.blackmautz.telemetry.all.custombutton');
const LightControlAction = new Action('de.blackmautz.telemetry.all.lightcontrol');
const WiperUpAction = new Action('de.blackmautz.telemetry.all.wiperup');
const WiperDownAction = new Action('de.blackmautz.telemetry.all.wiperdown');
const HornAction = new Action('de.blackmautz.telemetry.all.horn');
const HighBeamFlasherAction = new Action('de.blackmautz.telemetry.all.highbeamflasher');
const LightSwitchAction = new Action('de.blackmautz.telemetry.all.lightswitchv2');
const InfosAction = new Action('de.blackmautz.telemetry.all.infos');
const FuelAction = new Action('de.blackmautz.telemetry.all.fuel');
const PassengersAction = new Action('de.blackmautz.telemetry.all.passengers');
const EngineInfoAction = new Action('de.blackmautz.telemetry.all.engineinfo');
const SpeedDisplayAction = new Action('de.blackmautz.telemetry.all.speeddisplay');
const FixingBrakeToggleAction = new Action('de.blackmautz.telemetry.all.fixingbraketoggle');
const StopBrakeAction = new Action('de.blackmautz.telemetry.all.stopbrake');
const KneelingLiftAction = new Action('de.blackmautz.telemetry.all.kneelinglift');
const ClimateControlAction = new Action('de.blackmautz.telemetry.all.climatecontrol');
const WindowControlAction = new Action('de.blackmautz.telemetry.all.windowcontrol');
const PantographOnAction = new Action('de.blackmautz.telemetry.all.pantographon');
const PantographOffAction = new Action('de.blackmautz.telemetry.all.pantographoff');
const CameraSwitchAction = new Action('de.blackmautz.telemetry.all.cameraswitch');
const USBClearanceAction = new Action('de.blackmautz.telemetry.all.usbclearance');
const WheelchairRequestAction = new Action('de.blackmautz.telemetry.all.wheelchairrequest');
const StopRequestAction = new Action('de.blackmautz.telemetry.all.stoprequest');
const LEDMonitorAction = new Action('de.blackmautz.telemetry.all.ledmonitor');
// Universal Interior Light (auto-detects bus type)
const InteriorLightAction = new Action('de.blackmautz.telemetry.all.interiorlightv2');
// Scania-specific actions
const ScaniaLightsAction = new Action('de.blackmautz.telemetry.all.scaniafoglights');
// VDL-specific actions
const ReadingLightAction = new Action('de.blackmautz.telemetry.all.readinglight');
// Universal Driver Light
const DriverLightAction = new Action('de.blackmautz.telemetry.all.driverlight');
// ALL actions (works on multiple buses)
const RetarderAction = new Action('de.blackmautz.telemetry.all.retarder');
const TractionControlAction = new Action('de.blackmautz.telemetry.all.tractioncontrol');
const RBLAction = new Action('de.blackmautz.telemetry.all.rbl');

var GlobalTargetAddress = null
var GlobalTargetPort = null
var LastSendCommand = null

var GlobalIconUpdateData = [];
var GlobalInterval = [];
var GlobalLampData = [];
var GlobalButtonData = [];
var GlobalDoorsData = [];
var GlobalCurrentState = [];
var GlobalPaymentStatus = null;
var GlobalCurrentGear = "";
var CurrentVehicle = null;
var CurrentVehicleVariant = null;

// VDL Interior Light State Tracking (per button context)
var VDLLightStates = {}; // { contextId: { bright: false, dimmed: false } }

// MAN Interior Light State Tracking (per button context)
var MANLightStates = {}; // { contextId: { lowerBright: false, lowerDimmed: false, upperBright: false, upperDimmed: false } }

var GlobalEngineStarted = false;
var GlobalIgnitionEnabled = false;
var GlobalFanSpeed = 0;
var GlobalDriverTemp = 0;
var GlobalACTemp = 0;
var GlobalStopRequest = false;
var GlobalSecondDoorRequest = false;
var GlobalThirdDoorRequest = false;
var GlobalFourthDoorRequest = false;
var GlobalWiperLevel = 0;
var GlobalCurrentFuel = 0.0;
var GlobalMaxFuel = 0.0;
var GlobalLowFuelWarning = false;
var GlobalNumSeats = 0;
var GlobalNumOccupiedSeats = 0;
var GlobalLoad = 0.0;
var GlobalMass = 0.0;
var GlobalDoorsOpen = 0;
var GlobalPassengerDoorsOpen = false;
var GlobalLuggageDoorsOpen = false;
var GlobalRPM = 0.0;
var GlobalMaxRPM = 11000.0;
var GlobalEngineTemperature = 0.0;
var GlobalThrottle = 0.0;
var GlobalSpeed = 0.0;
var GlobalAllowedSpeed = 0.0;
var GlobalCruiseControlActive = false;
var GlobalGearbox = "";
var GlobalBrake = 0.0;

// Store settings per context for dropdown buttons
var ButtonSettings = {};

var SaleStatusRegister = {};
var StartOptions = {};
var failedConnectionCounter = 10;



// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Global Functions

async function fetchWithTimeout(resource, options = {}) {
	const { timeout = 8000 } = options;
	
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
  
	try
	{
		const response = await fetch(resource, {
	  	...options,
	  	signal: controller.signal  
		});
	clearTimeout(id);
	failedConnectionCounter = 0;
	return response;
	}
	catch (e)
	{
		failedConnectionCounter += 1
		if(failedConnectionCounter > 20)
			failedConnectionCounter = 20;
	}
}

async function CheckCurrentVehicle()
{

	if(GlobalTargetAddress == null || GlobalTargetPort == null)
		{
			GlobalSettings = $SD.getGlobalSettings();
			return;
		}

	var aviableVehicles = 0;
	try
	{
		TargetUrl = "http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/vehicles"
		await fetchWithTimeout(TargetUrl, {timeout: 200})
		.then(data => {return data.json()})
		.then(data => {
			aviableVehicles = data.length;
		});
	}
	catch (error)
	{
	}

	if(aviableVehicles < 1)
	{
		CurrentVehicle = null;
		return;
	}

	try
	{
		if(GlobalTargetAddress == null || GlobalTargetPort == null)
		{
			GlobalSettings = $SD.getGlobalSettings();
		}
		else
		{
			TargetUrl = "http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/player"
			fetchWithTimeout(TargetUrl, {timeout: 200})
			.then(data => {
				if(data.text == "Not in Bus")
				{
					return null;
				}
				return data.json()
			}).then(data => {
				if(data.Mode != "Vehicle")
				{
					CurrentVehicle =null;
				}
				else
				{
					CurrentVehicle = data.CurrentVehicle;
				}
			})
		}
	}
	catch (error)
	{
		console.log("Get CurrentVehicle Failed:" + error);
		ConnectionFailed();
	}
}

function SendTelemetryCommand(SendTelemetryCommand)
{
	try
	{
		if(GlobalTargetAddress == null || GlobalTargetPort == null)
		{
			GlobalSettings = $SD.getGlobalSettings();
		}
		else
		{
			TargetUrl = "http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/Command?Command=" + SendTelemetryCommand;
			fetchWithTimeout(TargetUrl, {timeout: 200});
			console.log(TargetUrl);
		}
	}
	catch (error)
	{
		console.log("Send Command Failed:" + error);
		ConnectionFailed();
	}	
}

function SendTelemetryAction(SendTelemetryCommand)
{
	try
	{
		LastSendCommand = SendTelemetryCommand
	
		if(CurrentVehicle == null)
		{
			console.log("[ERROR] CurrentVehicle is NULL! Cannot send telemetry action:", SendTelemetryCommand);
			return;
		}
	
		if(GlobalTargetAddress == null || GlobalTargetPort == null)
		{
			console.log("[ERROR] GlobalTargetAddress or GlobalTargetPort is NULL!");
			GlobalSettings = $SD.getGlobalSettings();
		}
		else
		{
			TargetUrl = "http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/vehicles/" + CurrentVehicle + SendTelemetryCommand
			console.log("[SendTelemetryAction] URL:", TargetUrl);
			fetchWithTimeout(TargetUrl, {timeout: 200});
			LastSendCommand = null
		}
	}
	catch (error)
	{
		console.log("Send Action Failed:" + error);
		ConnectionFailed();
	}
}

function UpdateTelemetryData()
{
	try
	{
		if(CurrentVehicle == null)
		{
			CheckCurrentVehicle();
			return;
		}
		if(GlobalTargetAddress == null || GlobalTargetPort == null)
		{
			GlobalSettings = $SD.getGlobalSettings();
		}
		else
		{
			TargetUrl = "http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/vehicles/" + CurrentVehicle + "?vars=Buttons,AllLamps,IsPlayerControlled,BusLogic,EngineStarted,IgnitionEnabled,WiperLevel,CurrentFuel,MaxFuel,LowFuelWarning,Doors,PassengerDoorsOpen,LuggageDoorsOpen,NumSeats,NumOccupiedSeats,Load,Mass,RPM,MaxRPM,EngineTemperature,Throttle,Speed,AllowedSpeed,CruiseControlActive,Gearbox,Brake"
			fetchWithTimeout(TargetUrl, {timeout: 200})
			.then(data => {return data.json()})
			.catch(err => {
				// Scania doesn't support ?vars query, use /vehicles/current instead
				return fetchWithTimeout("http://" + GlobalTargetAddress + ":" + GlobalTargetPort + "/vehicles/current", {timeout: 200}).then(d => d.json());
			})
			.then(data => {
				GlobalLampData = data.AllLamps || [];
				GlobalButtonData = data.Buttons || [];
				GlobalDoorsData = data.Doors || [];
				
				console.log("Data loaded - AllLamps:", GlobalLampData.length, "Buttons:", GlobalButtonData.length, "Doors:", GlobalDoorsData.length);
				if(GlobalDoorsData.length > 0) {
					console.log("Scania Doors detected:", GlobalDoorsData.map(d => d.Name + "=" + d.Open).join(", "));
				}
				
				// Store engine and ignition status
				GlobalEngineStarted = data.EngineStarted;
				GlobalIgnitionEnabled = data.IgnitionEnabled;
				
				// Store Stop Request status from AllLamps (bus-specific LED names)
				if(data.AllLamps) {
					// Check all bus-specific LED names: Solaris, Mercedes, Scania
					var stopRequestLED = 0;
					if(data.AllLamps["DB Stop Request"] !== undefined) {
						stopRequestLED = data.AllLamps["DB Stop Request"];  // Solaris/VDL/MAN
					} else if(data.AllLamps["LED StopRequest"] !== undefined) {
						stopRequestLED = data.AllLamps["LED StopRequest"];  // Mercedes
					} else if(data.AllLamps["TachoStopRequest"] !== undefined) {
						stopRequestLED = data.AllLamps["TachoStopRequest"];  // Scania
					}
					
					GlobalStopRequest = (stopRequestLED > 0);
					GlobalSecondDoorRequest = (data.AllLamps["SecondDoorRequest"] > 0);
					GlobalThirdDoorRequest = (data.AllLamps["ThirdDoorRequest"] > 0);
					GlobalFourthDoorRequest = (data.AllLamps["FourthDoorRequest"] > 0);
				}
				
				// Store Wiper Level
				if(data.WiperLevel !== undefined) {
					GlobalWiperLevel = data.WiperLevel;
				}
				
				// Store fuel data
				if(data.CurrentFuel !== undefined) {
					GlobalCurrentFuel = data.CurrentFuel;
				}
				if(data.MaxFuel !== undefined) {
					GlobalMaxFuel = data.MaxFuel;
				}
				if(data.LowFuelWarning !== undefined) {
					GlobalLowFuelWarning = (data.LowFuelWarning === "true" || data.LowFuelWarning === true);
				}
				
				// Store passenger data
				if(data.NumSeats !== undefined) {
					GlobalNumSeats = data.NumSeats;
				}
				if(data.NumOccupiedSeats !== undefined) {
					GlobalNumOccupiedSeats = data.NumOccupiedSeats;
				}
				if(data.Load !== undefined) {
					GlobalLoad = data.Load;
				}
				if(data.Mass !== undefined) {
					GlobalMass = data.Mass;
				}
				if(data.PassengerDoorsOpen !== undefined) {
					GlobalPassengerDoorsOpen = (data.PassengerDoorsOpen === "true" || data.PassengerDoorsOpen === true);
				}
				if(data.LuggageDoorsOpen !== undefined) {
					GlobalLuggageDoorsOpen = (data.LuggageDoorsOpen === "true" || data.LuggageDoorsOpen === true);
				}
				if(data.Doors !== undefined && Array.isArray(data.Doors)) {
					GlobalDoorsOpen = data.Doors.filter(d => d.Open === "true" || d.Open === true).length;
				}
				
				// Store engine and speed data
				if(data.RPM !== undefined) {
					GlobalRPM = parseFloat(data.RPM);
				}
				if(data.MaxRPM !== undefined) {
					GlobalMaxRPM = parseFloat(data.MaxRPM);
				}
				if(data.EngineTemperature !== undefined) {
					GlobalEngineTemperature = parseFloat(data.EngineTemperature);
				}
				if(data.Throttle !== undefined) {
					GlobalThrottle = parseFloat(data.Throttle);
				}
				if(data.Speed !== undefined) {
					GlobalSpeed = parseFloat(data.Speed);
				}
				if(data.AllowedSpeed !== undefined) {
					GlobalAllowedSpeed = parseFloat(data.AllowedSpeed);
				}
				if(data.CruiseControlActive !== undefined) {
					GlobalCruiseControlActive = (data.CruiseControlActive === "true" || data.CruiseControlActive === true);
				}
				if(data.Gearbox !== undefined) {
					GlobalGearbox = data.Gearbox;
				}
				if(data.Brake !== undefined) {
					GlobalBrake = parseFloat(data.Brake);
				}
				
				// Store climate control values from Buttons
				if(data.Buttons) {
					var fanSpeed = data.Buttons.find(b => b.Name === "Driver Fan Speed");
					var driverTemp = data.Buttons.find(b => b.Name === "Driver Temperature");
					var acTemp = data.Buttons.find(b => b.Name === "Air Condition Temperature");
					
					if(fanSpeed && fanSpeed.Value !== undefined) GlobalFanSpeed = fanSpeed.Value;
					if(driverTemp && driverTemp.Value !== undefined) GlobalDriverTemp = driverTemp.Value;
					// AC Temp uses State, not Value - map state to value
					if(acTemp) {
						if(acTemp.State === "Primary") GlobalACTemp = 0.0;
						else if(acTemp.State === "Secondary") GlobalACTemp = 0.5;
						else if(acTemp.Value !== undefined) GlobalACTemp = acTemp.Value;
					}
				}

				// Update Sales
				if(GlobalPaymentStatus != data.BusLogic.Sales)
				{
					GlobalPaymentStatus = data.BusLogic.Sales;
					SaleStatusChanged();
				}

				// Update GEar
				GlobalCurrentGear = GetCurrentGear();
				if(data.IsPlayerControlled == "false")
				{
					CurrentVehicle = null;
				}

				//UpdateLamps
				GlobalIconUpdateData.forEach(IconUpdate => {
					UpdateIcon(IconUpdate.SourceType, IconUpdate.SourceName, IconUpdate.TargetValue, IconUpdate.OffIcon, IconUpdate.OnIcon, IconUpdate.Context);
				});
			})
		}
	}
	catch (error)
	{
		console.log("Get Telemetry Data Failed:" + error);
		ConnectionFailed();
	}
}

function ConnectionFailed()
{
	CurrentVehicle = null;
	SaleStatusChanged();
	GlobalLampData.forEach(LampData => {
		LampData = 0.0;
	});
}

$SD.onConnected(({ actionInfo, appInfo, connection, messageType, port, uuid }) => {
	console.log('Stream Deck connected!');

	// Init Start Options
	StartOptions["BusName"] = "Scania_CitywideLF_18M4D";
	StartOptions["Weather"] = "Overcast";
	StartOptions["Date"] = "2023.7.4-1.0.0";
	StartOptions["SpawnInBus"] = "true";
	StartOptions["Map"] = "Berlin";
	StartOptions["OperatingPlanType"] = "Standard";
	StartOptions["OperatingPlan"] = "Standard_123";
	StartOptions["Line"] = "123";
	StartOptions["Stop"] = "Mäckeritzwiesen";
	StartOptions["Tour"] = "05";
	StartOptions["RouteIndex"] = "4";
});


$SD.onDidReceiveGlobalSettings(({payload}) =>
{
	// Set default values if not configured yet
	if(!payload.settings || !payload.settings.TargetIp || !payload.settings.TargetPort) {
		$SD.setGlobalSettings({
			TargetIp: "127.0.0.1",
			TargetPort: "37337"
		});
		GlobalTargetAddress = "127.0.0.1";
		GlobalTargetPort = "37337";
	} else {
		GlobalTargetAddress = payload.settings.TargetIp;
		GlobalTargetPort = payload.settings.TargetPort;
	}
	
	if(LastSendCommand != null)
	{
		SendTelemetryAction(LastSendCommand);
	}
});function AddInterval(Context, IntervalFunction)
{
	if(GlobalInterval["LampDataUpdate"] === undefined)
	{
		GlobalInterval["LampDataUpdate"] = setInterval( function() {UpdateTelemetryData() }, 300);
	}
	if(GlobalInterval["CurrentVehicleUpdate"] === undefined)
	{
		GlobalInterval["CurrentVehicleUpdate"] = setInterval ( function() {CheckCurrentVehicle()}, 1000);
	}

	if(GlobalInterval[Context] !== undefined)
	{
		clearInterval(GlobalInterval[Context]);
	}
	GlobalInterval[Context] = setInterval(IntervalFunction, 100)
}

function RemoveInterval(Context)
{
	if(GlobalInterval[Context] !== undefined)
	{
		clearInterval(GlobalInterval[Context]);
	}
}

function truncate(str, n)
{
	return (str.length > n) ? str.slice(0, n-2) + '...' : str;
};

// UpdateIcon(IconUpdate.SourceType, IconUpdate.SourceName, IconUpdate.TargetValue, IconUpdate.OffIcon, IconUpdate.OnIcon, IconUpdate.Context);
function AddIconUpdateData(SourceType, SourceName, SourceTargetValue, OffIcon, OnIcon, Context)
{

	if(GlobalInterval["LampDataUpdate"] === undefined)
	{
		GlobalInterval["LampDataUpdate"] = setInterval( function() {UpdateTelemetryData() }, 300);
	}
	if(GlobalInterval["CurrentVehicleUpdate"] === undefined)
	{
		GlobalInterval["CurrentVehicleUpdate"] = setInterval ( function() {CheckCurrentVehicle()}, 1000);
	}

	var newData = {};
	newData["SourceType"] = SourceType;
	newData["SourceName"] = SourceName;
	newData["TargetValue"] = SourceTargetValue;
	newData["OffIcon"] = OffIcon;
	newData["OnIcon"] = OnIcon;
	newData["Context"] = Context;

	if(GlobalIconUpdateData.indexOf(newData) < 0)
	{
		GlobalIconUpdateData.push(newData);
	}

}

function RemoveIconUpdateData(context)
{
	var removelist = [];
	for (let i = 0; i < GlobalIconUpdateData.length; i++) {
		const data = GlobalIconUpdateData[i];
		console.log(data); 
		if(data.Context == context)
		{
			removelist.push(i);
		}
	}

	removelist.forEach(localIndex => {
		delete GlobalIconUpdateData[localIndex];
	});
}


function UpdateButtonIcon(LightName, OnIcon, OffIcon, context)
{
	if(LightName && OnIcon && OffIcon && context)
	{
		var onIcon = "actions/assets/" + OnIcon;
		var offIcon = "actions/assets/" + OffIcon;
		
		// Register for continuous updates instead of one-time update
		AddIconUpdateData("light", LightName, "", offIcon, onIcon, context);
	}
}

// Update icon based on multiple possible LED names (bus-specific)
function UpdateButtonIconMultiLED(LedNames, OnIcon, OffIcon, context)
{
	if(LedNames && OnIcon && OffIcon && context)
	{
		var onIcon = "actions/assets/" + OnIcon;
		var offIcon = "actions/assets/" + OffIcon;
		
		// Try each LED name until one is found
		for(var i = 0; i < LedNames.length; i++) {
			if(GlobalLampData[LedNames[i]] !== undefined) {
				AddIconUpdateData("light", LedNames[i], "", offIcon, onIcon, context);
				return; // Found LED, stop searching
			}
		}
	}
}

function UpdateButtonState(ButtonName, ActiveState, OffIcon, OnIcon, context)
{
	if(ButtonName && ActiveState && OffIcon && OnIcon && context)
	{
		var offIcon = "actions/assets/" + OffIcon;
		var onIcon = "actions/assets/" + OnIcon;
		
		var button = GlobalButtonData.find(b => b.Name === ButtonName);
		
		if(button && button.State != GlobalCurrentState[context])
		{
			GlobalCurrentState[context] = button.State;
			console.log("[UpdateButtonState] ⚡ STATE CHANGED! Button:", ButtonName, "NewState:", button.State, "Icon:", button.State === ActiveState ? "ON ("+onIcon+")" : "OFF ("+offIcon+")");
			if(button.State === ActiveState)
			{
				$SD.setImage(context, onIcon);
			}
			else
			{
				$SD.setImage(context, offIcon);
			}
		}
	}
}

function UpdateInteriorLightState(ButtonName, TargetState, OffIcon, OnIcon, context)
{
	if(ButtonName && TargetState && OffIcon && OnIcon && context)
	{
		var offIcon = "actions/assets/" + OffIcon;
		var onIcon = "actions/assets/" + OnIcon;
		
		var button = GlobalButtonData.find(b => b.Name === ButtonName);
		if(button && button.State != GlobalCurrentState[context])
		{
			GlobalCurrentState[context] = button.State;
			// Check if current state matches target (Tertiary for Dim, Secondary for Bright)
			if(button.State === TargetState)
			{
				$SD.setImage(context, onIcon);
			}
			else
			{
				$SD.setImage(context, offIcon);
			}
		}
	}
}

function UpdateIcon(SourceType, SourceName, SourceTargetValue, OffIcon, OnIcon, Context)
{
	if(!SourceType || !SourceName || !OffIcon || !OnIcon || !Context)
	{
		return;
	}

	switch(SourceType)
	{
		case "button":
			if(SourceTargetValue)
			{
				GlobalButtonData.forEach(ButtonData => {
					if(ButtonData.Name == SourceName && ButtonData.State != GlobalCurrentState[Context])
					{
						GlobalCurrentState[Context] = ButtonData.State;
						if(ButtonData.State == SourceTargetValue)
						{
							$SD.setImage(Context, OnIcon);
							return;
						}
						$SD.setImage(Context, OffIcon);
						return;
					}
				});
			}
			break;
	case "light":
		if(GlobalLampData[SourceName] != GlobalCurrentState[Context])
		{
			GlobalCurrentState[Context] = GlobalLampData[SourceName];
			if(GlobalLampData[SourceName] >= 1.0)
			{
				$SD.setImage(Context, OnIcon);
				return;
			}
			$SD.setImage(Context, OffIcon);
			return;
		}
		break;
}
}
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Door Action Functions

DoorAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Map door selection to event names
	var eventMapping = {
		"Door 1": "DoorFrontOpenClose",
		"Door 2": "MiddleDoorOpenClose",
		"Door 3": "RearDoorOpenClose",
		"Door 4": "FourthDoorOpenClose",
		"Clearance": "ToggleDoorClearance",
		"Auto Kneeling": "toggleAutoKneeling",
		"Door Autoclose": "PreventRearAuto",
		"Lock Left": "LockLeftDoor",
		"Lock Right": "LockRightDoor"
	};
	
	// Alternative door events for different bus models
	// Scania and other buses use different event names than Solaris/Mercedes
	var alternativeEvents = {
		"Door 2": "DoorMiddleOpenClose",
		"Door 3": "DoorRearOpenClose",
		"Door 4": "DoorFourthOpenClose",
		"Lock Left": "FrontDoorDeactivateLeft",
		"Lock Right": "FrontDoorDeactivateRight"
	};
	
	// Mercedes/Scania door lock toggle logic
	// Mercedes: Tertiary = Left locked, Secondary = Right locked
	// Scania: Secondary = Left locked, Tertiary = Right locked (REVERSED!)
	if(payload.settings.DoorSelector === "Lock Left") {
		var doorLockButton = GlobalButtonData.find(b => b.Name === "DoorLock 1");
		var isMercedes = CurrentVehicle && CurrentVehicle.includes("Mercedes");
		var isScania = CurrentVehicle && CurrentVehicle.includes("Scania");
		
		// Check if already locked left (state depends on bus type)
		var isLockedLeft = false;
		if(isMercedes) {
			isLockedLeft = (doorLockButton && (doorLockButton.State === "Tertiary" || doorLockButton.State === "DoorWingLockLeft"));
		} else if(isScania) {
			isLockedLeft = (doorLockButton && doorLockButton.State === "Secondary");
		} else {
			// Solaris/VDL/MAN use separate buttons, not this code path
			isLockedLeft = false;
		}
		
		if(isLockedLeft) {
			// Already locked left, unlock
			if(isMercedes) {
				SendTelemetryAction("/sendeventpress?event=DoorWingLockOff");
			} else if(isScania) {
				// Scania events are REVERSED - send Right to unlock Left
				SendTelemetryAction("/sendeventpress?event=LockRightDoor");
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateRight");
			} else {
				// Solaris/VDL/MAN - try FrontDoorDeactivate FIRST, then LockLeftDoor
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateLeft");
				SendTelemetryAction("/sendeventpress?event=LockLeftDoor");
			}
		} else {
			// Check if locked right (must unlock first for Mercedes/Scania)
			var isLockedRight = false;
			if(isMercedes) {
				isLockedRight = (doorLockButton && (doorLockButton.State === "Secondary" || doorLockButton.State === "DoorWingLockRight"));
			} else if(isScania) {
				isLockedRight = (doorLockButton && doorLockButton.State === "Tertiary");
			}
			
			if(isLockedRight && (isMercedes || isScania)) {
				return; // Must unlock right first
			}
			
			// Lock left - send bus-specific event
			if(isMercedes) {
				SendTelemetryAction("/sendeventpress?event=DoorWingLockLeft");
			} else if(isScania) {
				// Scania events are REVERSED - send Right to lock Left
				SendTelemetryAction("/sendeventpress?event=LockRightDoor");
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateRight");
			} else {
				// Solaris/VDL/MAN - try FrontDoorDeactivate FIRST, then LockLeftDoor
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateLeft");
				SendTelemetryAction("/sendeventpress?event=LockLeftDoor");
			}
		}
		return;
	}
	
	if(payload.settings.DoorSelector === "Lock Right") {
		var doorLockButton = GlobalButtonData.find(b => b.Name === "DoorLock 1");
		var isMercedes = CurrentVehicle && CurrentVehicle.includes("Mercedes");
		var isScania = CurrentVehicle && CurrentVehicle.includes("Scania");
		
		// Check if already locked right (state depends on bus type)
		var isLockedRight = false;
		if(isMercedes) {
			isLockedRight = (doorLockButton && (doorLockButton.State === "Secondary" || doorLockButton.State === "DoorWingLockRight"));
		} else if(isScania) {
			isLockedRight = (doorLockButton && doorLockButton.State === "Tertiary");
		} else {
			// Solaris/VDL/MAN use separate buttons, not this code path
			isLockedRight = false;
		}
		
		if(isLockedRight) {
			// Already locked right, unlock
			if(isMercedes) {
				SendTelemetryAction("/sendeventpress?event=DoorWingLockOff");
			} else if(isScania) {
				// Scania events are REVERSED - send Left to unlock Right
				SendTelemetryAction("/sendeventpress?event=LockLeftDoor");
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateLeft");
			} else {
				// Solaris/VDL/MAN - try FrontDoorDeactivate FIRST, then LockRightDoor
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateRight");
				SendTelemetryAction("/sendeventpress?event=LockRightDoor");
			}
		} else {
			// Check if locked left (must unlock first for Mercedes/Scania)
			var isLockedLeft = false;
			if(isMercedes) {
				isLockedLeft = (doorLockButton && (doorLockButton.State === "Tertiary" || doorLockButton.State === "DoorWingLockLeft"));
			} else if(isScania) {
				isLockedLeft = (doorLockButton && doorLockButton.State === "Secondary");
			}
			
			if(isLockedLeft && (isMercedes || isScania)) {
				return; // Must unlock left first
			}
			
			// Lock right - send bus-specific event
			if(isMercedes) {
				SendTelemetryAction("/sendeventpress?event=DoorWingLockRight");
			} else if(isScania) {
				// Scania events are REVERSED - send Left to lock Right
				SendTelemetryAction("/sendeventpress?event=LockLeftDoor");
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateLeft");
			} else {
				// Solaris/VDL/MAN - try FrontDoorDeactivate FIRST, then LockRightDoor
				SendTelemetryAction("/sendeventpress?event=FrontDoorDeactivateRight");
				SendTelemetryAction("/sendeventpress?event=LockRightDoor");
			}
		}
		return;
	}
	
	var eventName = eventMapping[payload.settings.DoorSelector];
	var alternativeEvent = alternativeEvents[payload.settings.DoorSelector];
	
	if(eventName) {
		SendTelemetryAction("/sendevent?event=" + eventName);
		SendTelemetryAction("/sendeventpress?event=" + eventName);
	}
	if(alternativeEvent) {
		SendTelemetryAction("/sendevent?event=" + alternativeEvent);
		SendTelemetryAction("/sendeventpress?event=" + alternativeEvent);
	}
	
	if(!eventName && !alternativeEvent) {
		// Fallback to button method for unknown options
		SendTelemetryAction("/setbutton?button=" + payload.settings.DoorSelector + "&state=1");
	}
});

DoorAction.onKeyUp(({ action, context, device, event, payload }) => {
	if(payload.settings.DoorSelector  == "Clearance")
	{
		return;	
	}
	// Only use button release for non-mapped doors
	var eventName = null;
	switch(payload.settings.DoorSelector) {
		case "Door 1":
		case "Door 2":
		case "Door 3":
		case "Door 4":
			// Solaris doors use toggle events, no need for release
			return;
	}
	SendTelemetryAction("/setbutton?button=" + payload.settings.DoorSelector + "&state=0");
});

DoorAction.onWillAppear(({ action, context, device, event, payload }) =>
{
	// Get settings - this will trigger onDidReceiveSettings
	$SD.getSettings(context);
});

DoorAction.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.dooraction", ({context, payload}) => 
{
	// Clear any existing intervals first
	RemoveInterval(context);
	
	// Store settings for this button
	ButtonSettings[context] = payload.settings;
	
	DoorName = payload.settings.DoorSelector
	if(DoorName === undefined) 
	{
		DoorName = "Door 1";
		payload.settings.DoorSelector = "Door 1";
		$SD.setSettings(context, payload.settings);
	}
	
	// Handle special door functions
	if(DoorName == "Clearance")
	{
		$SD.setImage(context, "actions/assets/door_auto.png");
		AddInterval(context, function() {
			// Check DoorClearance button state (works for all bus types)
			var button = GlobalButtonData.find(b => b.Name === "DoorClearance");
			if(button) {
				var isActive = (button.State === true || button.State === "true" || button.State === "Secondary");
				var newImage = isActive ? "actions/assets/door_auto_open.png" : "actions/assets/door_auto.png";
				if(GlobalCurrentState[context] != newImage) {
					GlobalCurrentState[context] = newImage;
					$SD.setImage(context, newImage);
				}
			}
		});
		return;
	}
	
	// Handle Lock Left Doors with status tracking
	if(DoorName == "Lock Left")
	{
		$SD.setImage(context, "actions/assets/1_door_close_left.png");
		AddInterval(context, function() {
			UpdateDoorLockStatus(context, "Door Lock Left", "1_door_close_left.png", "1_door_close_left_on.png");
		});
		return;
	}
	
	// Handle Lock Right Doors with status tracking
	if(DoorName == "Lock Right")
	{
		$SD.setImage(context, "actions/assets/1_door_close_right.png");
		AddInterval(context, function() {
			UpdateDoorLockStatus(context, "Door Lock Right", "1_door_close_right.png", "1_door_close_right_on.png");
		});
		return;
	}
	
	// For other new functions (Auto Kneeling, Autoclose), just show a generic icon
	if(DoorName == "Auto Kneeling")
	{
		$SD.setImage(context, "actions/assets/auto_kneeling.png");
		AddInterval(context, function() {UpdateButtonState("Auto Kneeling", "Secondary", "auto_kneeling.png", "auto_kneeling_on.png", context)});
		return;
	}
	
	if(DoorName == "Door Autoclose")
	{
		// Track the Prevent Rear Auto button status
		$SD.setImage(context, "actions/assets/kinderwagen.png");
		AddInterval(context, function() {UpdateButtonState("Door Autoclose", "Secondary", "kinderwagen.png", "kinderwagen_on.png", context)});
		return;
	}
	
	// Get door number from selection (Door 1 → 1, Door 2 → 2, etc.)
	var doorNumber = DoorName.replace("Door ", "");
	$SD.setImage(context, "actions/assets/" + doorNumber + ".png")
	
	// Use different methods for different buses
	AddInterval(context, function() {
		var lampValue = 0.0;
		var doorProgress = 0.0; // For percentage display
		
		// Scania: Use Doors property
		if(GlobalDoorsData && Array.isArray(GlobalDoorsData) && GlobalDoorsData.length > 0) {
			var doorName = "";
			if(doorNumber == "1") doorName = "Door Front";
			else if(doorNumber == "2") doorName = "Door Middle"; // Scania
			else if(doorNumber == "3") doorName = "Door Rear";
			else if(doorNumber == "4") doorName = "Door Fourth"; // Solaris (Scania might use different name)
			
			if(doorName) {
				var door = GlobalDoorsData.find(d => d.Name === doorName);
				// Fallback for Solaris naming
				if(!door && doorNumber == "2") door = GlobalDoorsData.find(d => d.Name === "Door Second");
				if(!door && doorNumber == "3") door = GlobalDoorsData.find(d => d.Name === "Door Third");
				
				if(door) {
					// Use Progress instead of Open - more reliable
					// Progress > 0.5 means door is mostly open
					doorProgress = door.Progress || 0.0;
					if(doorProgress > 0.5) {
						lampValue = 1.0;
					} else {
						lampValue = 0.0;
					}
				}
			}
		}
		// Solaris & Mercedes: Use Lamps
		else if(GlobalLampData && typeof GlobalLampData === 'object') {
			if(doorNumber == "1") {
				lampValue = GlobalLampData["Door Button 1"] || GlobalLampData["Door 1 Light"] || GlobalLampData["ButtonLight Door 1"] || 0.0;
			} else if(doorNumber == "2") {
				lampValue = GlobalLampData["Door Button 2"] || GlobalLampData["Second Door Light Ext"] || GlobalLampData["Door 2 Light"] || GlobalLampData["ButtonLight Door 2"] || 0.0;
			} else if(doorNumber == "3") {
				lampValue = GlobalLampData["Door Button 3"] || GlobalLampData["Third Door Light Ext"] || GlobalLampData["Door 3 Light"] || GlobalLampData["ButtonLight Door 3"] || 0.0;
			} else if(doorNumber == "4") {
				lampValue = GlobalLampData["Door Button 4"] || GlobalLampData["Fourth Door Light Ext"] || GlobalLampData["Door 4 Light"] || GlobalLampData["ButtonLight Door 4"] || 0.0;
			}
		}
		
		if(GlobalCurrentState[context] != lampValue)
		{
			GlobalCurrentState[context] = lampValue;
			
			if(lampValue > 0.0)
			{
				// Door open
				$SD.setImage(context, "actions/assets/" + doorNumber + "_2.png")
			}
			else
			{
				// Door closed
				$SD.setImage(context, "actions/assets/" + doorNumber + ".png")
			}
		}
		
		// Show progress percentage if enabled
		var settings = ButtonSettings[context];
		if(settings && settings.ShowProgress === "true") {
			var percentage = Math.round(doorProgress * 100);
			$SD.setTitle(context, percentage + "%");
		} else {
			$SD.setTitle(context, "");
		}
	})
	
});

function UpdateButtonLightStatus(LightName, context, doorNumber)
{
	// Try both naming conventions: "ButtonLight Door 1" (old) and "Door Button 1" (Solaris)
	var lampValue = GlobalLampData[LightName];
	if(lampValue === undefined) {
		// Fallback: Try "Door Button X" format for Solaris
		lampValue = GlobalLampData["Door Button " + doorNumber];
	}
	
	console.log("UpdateButtonLightStatus - Door " + doorNumber + ", LightName: " + LightName + ", lampValue: " + lampValue);
	
	if(GlobalCurrentState[context] != lampValue)
	{
		GlobalCurrentState[context] = lampValue
		NewState = lampValue

		console.log("Door " + doorNumber + " Status changed to: " + NewState);

		if(NewState > 0.0)
		{
			// Door open - use _2.png variant
			console.log("Setting image to: actions/assets/" + doorNumber + "_2.png");
			$SD.setImage(context, "actions/assets/" + doorNumber + "_2.png")
		}
		else
		{
			// Door closed - use .png
			console.log("Setting image to: actions/assets/" + doorNumber + ".png");
			$SD.setImage(context, "actions/assets/" + doorNumber + ".png")
		}
	}
}

function UpdateDoorLockStatus(context, buttonName, iconOff, iconOn)
{
	// Get button state from GlobalButtonData array
	var buttonState = null;
	
	// Check if GlobalButtonData is valid
	if(!GlobalButtonData || GlobalButtonData.length === 0) {
		// Data not loaded yet, show default icon
		$SD.setImage(context, "actions/assets/" + iconOff);
		return;
	}
	
	// Scania & Mercedes: Check DoorLock 1 button (unified left/right)
	var doorLockButton = GlobalButtonData.find(b => b.Name === "DoorLock 1");
	if(doorLockButton) {
		// Scania: Tertiary = left locked, Secondary = right locked
		// Mercedes: DoorWingLockLeft = left locked, DoorWingLockRight = right locked
		if(buttonName === "Door Lock Left") {
			if(doorLockButton.State === "Tertiary" || doorLockButton.State === "DoorWingLockLeft") {
				buttonState = "Secondary";
			} else {
				buttonState = "Primary";
			}
		} else if(buttonName === "Door Lock Right") {
			if(doorLockButton.State === "Secondary" || doorLockButton.State === "DoorWingLockRight") {
				buttonState = "Secondary";
			} else {
				buttonState = "Primary";
			}
		}
	}
	// Solaris: Separate buttons
	else {
		for(var i = 0; i < GlobalButtonData.length; i++) {
			if(GlobalButtonData[i].Name === buttonName) {
				buttonState = GlobalButtonData[i].State;
				break;
			}
		}
	}
	
	// Determine which icon to show based on state
	// "Primary" = unlocked, "Secondary" = locked
	var newImage = "";
	if(buttonState === "Secondary") {
		// Locked
		newImage = "actions/assets/" + iconOn;
	} else {
		// Unlocked (Primary or undefined)
		newImage = "actions/assets/" + iconOff;
	}
	
	// Only update if changed
	if(GlobalCurrentState[context] != newImage) {
		GlobalCurrentState[context] = newImage;
		$SD.setImage(context, newImage);
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Cash Action Functions

CashAction.onKeyUp(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=" + payload.settings.CashChangeSelect)
});

CashAction.onWillAppear(({ action, context, device, event, payload }) =>
{
	$SD.getSettings(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.changeaction", ({context, payload}) => 
{
	console.log(payload)
	var selected = payload.settings.CashChangeSelect
	if(selected == undefined)
	{
		payload.settings.CashChangeSelect = "Coins5"
		$SD.setSettings(context, payload.settings);
	}
	

	if(payload.settings.hasOwnProperty("AutoLabel"))
		GenerateAutLabel(selected, context)
});




function GenerateAutLabel(selected, context)
{
	var newTitle = ""

	switch(selected)
	{
		case "Coins5":
			newTitle = "0.05 €";
			break;
		case "Coins10":
			newTitle = "0.10 €";
			break;
		case "Coins15":
			newTitle = "0.15 €";
			break;
		case "Coins20":
			newTitle = "0.20 €";
			break;
		case "Coins30":
			newTitle = "0.30 €";
			break;
		case "Coins50":
			newTitle = "0.50 €";
			break;
		case "Coins60":
			newTitle = "0.60 €";
			break;
		case "Coins100":
			newTitle = "1.00 €";
			break;
		case "Coins200":
			newTitle = "2.00 €";
			break;
		case "Coins400":
			newTitle = "4.00 €";
			break;
		case "Coins600":
			newTitle = "6.00 €";
			break;
		case "Coins800":
			newTitle = "8.00 €";
			break;
		case "Take Cash Money":
			newTitle = "Grab";
			break;
	}

	$SD.setTitle(context, newTitle)
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Gearswitch Action Functions

function GetCurrentGear()
{
	for(button in GlobalButtonData)
	{
		if(GlobalButtonData[button].Name == "GearSwitch")
			return GlobalButtonData[button].State
	}
	return null
}


function SetGearswitchIcon(ButtonIndex, context)
{
	IconId = "R"
	ButtonState = "Reverse"
	if(ButtonIndex == 2)
	{
		IconId = "N"
		ButtonState = "Neutral"
	}
	if(ButtonIndex == 1)
	{
		IconId = "D";
		ButtonState = "Drive";
	}

	IconState = "Normal";
	if(GlobalCurrentGear == ButtonState)
		IconState = "Pushed";
	
	$SD.setImage(context, "actions/assets/Icon_" + IconId + "_" + IconState)
}

GearSwitchAction.onKeyUp(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/setbutton?button=GearSwitch&state=" + (payload.settings.GearSelection - 1))
});

GearSwitchAction.onWillAppear(({ action, context, device, event, payload }) =>
{
	$SD.getSettings(context);
});

DoorAction.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});

GearSwitchAction.onKeyDown(({ action, context, device, event, payload }) => {
	var gearSelection = parseInt(payload.settings.GearSelection);
	var eventName = "";
	
	switch(gearSelection) {
		case 1: // Drive
			eventName = "SetGearD";
			break;
		case 2: // Neutral
			eventName = "SetGearN";
			break;
		case 3: // Reverse
			eventName = "SetGearR";
			break;
		default:
			eventName = "SetGearN";
	}
	
	SendTelemetryAction("/sendeventpress?event=" + eventName);
	setTimeout(() => SendTelemetryAction("/sendeventrelease?event=" + eventName), 100);
});

GearSwitchAction.onWillAppear(({ action, context, device, event, payload }) =>
{
	$SD.getSettings(context);
});

GearSwitchAction.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.gearselect", ({context, payload}) => 
{
	console.log(context);
	var ButtonGear = payload.settings.GearSelection;
	if(ButtonGear == undefined)
	{
		ButtonGear = 2;
		payload.settings.GearSelection = 2;
		$SD.setSettings(context, payload.settings);
	}

	AddInterval(context, function() {SetGearswitchIcon(ButtonGear, context)})
	
});


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Ignition Action Functions

IgnitionAction.onKeyUp(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendeventrelease?event=MotorStartStop")
});

IgnitionAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendeventpress?event=MotorStartStop")
});

IgnitionAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Set initial icon
	$SD.setImage(context, "actions/assets/Icon_Ignition.png");
	
	// Get settings
	$SD.getSettings(context);
	
	// Start tracking engine and ignition status
	AddInterval(context, function() { UpdateIgnitionStatus(context, payload.settings); });
});

IgnitionAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// Track settings for each ignition button context
var GlobalIgnitionSettings = {};

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.ignition", ({context, payload}) => {
	// Store settings for this button
	GlobalIgnitionSettings[context] = payload.settings;
});

function UpdateIgnitionStatus(context, settings) {
	// Get settings from global storage if not provided
	if(!settings) {
		settings = GlobalIgnitionSettings[context] || {};
	}
	
	// Check if user wants to show status info (default: true)
	var showStatus = settings.ShowStatus;
	if(showStatus === undefined) {
		showStatus = true;
	}
	
	// Check both EngineStarted and IgnitionEnabled from global variables
	// Values can come as strings "true"/"false" or booleans from API
	var newImage = "";
	var statusText = "";
	
	var engineRunning = (GlobalEngineStarted === "true" || GlobalEngineStarted === true);
	var ignitionOn = (GlobalIgnitionEnabled === "true" || GlobalIgnitionEnabled === true);
	
	if(engineRunning) {
		// Motor läuft
		newImage = "actions/assets/Icon_Ignition_motorstart.png";
		statusText = "MOTOR\nAN";
	} else if(ignitionOn) {
		// Zündung an, aber Motor aus
		newImage = "actions/assets/Icon_Ignition_zündung.png";
		statusText = "ZÜNDUNG\nAN";
	} else {
		// Bus komplett aus
		newImage = "actions/assets/Icon_Ignition.png";
		statusText = "AUS";
	}
	
	// Only update if image or text changed
	if(GlobalCurrentState[context] != newImage) {
		GlobalCurrentState[context] = newImage;
		$SD.setImage(context, newImage);
		
		// Only show status text if checkbox is enabled
		if(showStatus) {
			$SD.setTitle(context, statusText);
		} else {
			$SD.setTitle(context, "");
		}
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Fixing Brake (uses press/release for proper toggle behavior)

FixingBrakeToggleAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendeventpress?event=FixingBrake");
});

FixingBrakeToggleAction.onKeyUp(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendeventrelease?event=FixingBrake");
});

FixingBrakeToggleAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	AddInterval(context, function() { 
		// ParkingBrake: Primary = Engaged/On, Secondary = Released/Off
		UpdateButtonState("ParkingBrake", "Primary", "Feststellbremse_Vers2.png", "Feststellbremse_Ver2_1.png", context);
	});
});

FixingBrakeToggleAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Climate Display Function

function UpdateClimateDisplay(context, displayType, settings) {
	// Check if user wants to show info (default: true)
	var showTemperature = settings.ShowTemperature;
	if(showTemperature === undefined) {
		showTemperature = true;
	}
	
	if(!showTemperature) {
		$SD.setTitle(context, "");
		return;
	}
	
	var displayText = "";
	
	if(displayType === "Fan Speed Display") {
		// Display fan speed as percentage (0.0 - 1.0 → 0% - 100%)
		var fanPercent = Math.round(GlobalFanSpeed * 100);
		displayText = "FAN\n" + fanPercent + "%";
	} else if(displayType === "Driver Temp Display") {
		// Display driver temperature as percentage
		var driverPercent = Math.round(GlobalDriverTemp * 100);
		displayText = "TEMP\n" + driverPercent + "%";
	} else if(displayType === "AC Temp Display") {
		// Display AC temperature as percentage
		var acPercent = Math.round(GlobalACTemp * 100);
		displayText = "AC\n" + acPercent + "%";
	}
	
	// Always update display
	GlobalCurrentState[context] = displayText;
	$SD.setTitle(context, displayText);
}

function UpdateStopRequestStatus(context) {
	// Check stop request from global variable
	var newImage = "";
	var displayText = "";
	
	if(GlobalStopRequest === true) {
		// Stop request active
		newImage = "actions/assets/Haltestelle1_2.png";
		
		// Check which doors have requests
		var doorRequests = [];
		if(GlobalSecondDoorRequest) doorRequests.push("2");
		if(GlobalThirdDoorRequest) doorRequests.push("3");
		if(GlobalFourthDoorRequest) doorRequests.push("4");
		
		if(doorRequests.length > 0) {
			displayText = "STOP\nREQUEST\nTÜR " + doorRequests.join(", ");
		} else {
			displayText = "STOP\nREQUEST";
		}
	} else {
		// No stop request
		newImage = "actions/assets/Haltestelle.png";
		displayText = "";
	}
	
	// Update image
	if(GlobalCurrentState[context] != newImage) {
		GlobalCurrentState[context] = newImage;
		$SD.setImage(context, newImage);
	}
	
	// Update text
	$SD.setTitle(context, displayText);
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// CustomAction

CustomAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendCustomAction(payload, true);
});

CustomAction.onKeyUp(({ action, context, device, event, payload }) => {
	SendCustomAction(payload, false);
});

function SendCustomAction(payload, bIsPress)
{
	if(payload.settings.TypeSelection == undefined)
	{
		payload.settings.TypeSelection = "Event";
		$SD.setSettings(context, payload.settings);
	}

	var ActionType = payload.settings.TypeSelection;
	var Data = payload.settings.CustomData;

	if(ActionType == "Event")
	{
		if(bIsPress)
		{
			SendTelemetryAction("/sendeventpress?event=" + Data);
			return;
		}
		SendTelemetryAction("/sendeventrelease?event=" + Data);
		return;
	}
	if(ActionType == "Cmd" && bIsPress)
	{
		SendTelemetryCommand(Data);
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Sale Status
SaleStatus.onWillAppear(({ action, context, device, event, payload }) =>
{
	SaleStatusRegister[context] = payload;
});

SaleStatus.onWillDisappear(({ action, context, device, event, payload }) =>
{
	SaleStatusRegister[context] = null;
});

function SaleStatusChanged()
{
	var mainImage = "actions/assets/Icon_SaleStatusIncomplete";

	if(GlobalPaymentStatus.ChangeAmountCorrect == "true")
	{
		mainImage = "actions/assets/Icon_SaleStatusComplete";
	}
	if(GlobalPaymentStatus.SaleInProgress == "false")
	{
		mainImage = "actions/assets/Icon_SaleStatus";
	}
	
	newImage = mainImage;

	Object.keys(SaleStatusRegister).forEach(SaleContext => {
		newTitle = "";
		
		curPayload = SaleStatusRegister[SaleContext];
		if(curPayload == null) 
		{
			return;
		}

		if(GlobalPaymentStatus.SaleInProgress == "true" && CurrentVehicle != null)
		{
			newImage = mainImage;
			switch(curPayload.settings.DisplayType)
			{
				case "Ticket":
				case undefined:
					{
						newTitle = "Ticket\n" + truncate(GlobalPaymentStatus.Ticket, 10) + "\n" + truncate(GlobalPaymentStatus.Zone, 10);
						break;
					}
				case "PayMethod":
					{
						newTitle =  "Method\n" + truncate(GlobalPaymentStatus.PaymentMethodText, 10);
						break;
					}
				case "Price":
					{
						newTitle = "Price\n" + GlobalPaymentStatus.Price;
						break;
					}
				case "Paid":
					{
						var tempString = (GlobalPaymentStatus.PaymentMethod == "Cash") ? GlobalPaymentStatus.Paid : "---";
						newTitle = "Paid\n" + tempString;
						break;
					}
				case "Change":
					{
						var tempString = (GlobalPaymentStatus.PaymentMethod == "Cash") ? GlobalPaymentStatus.ChangeGiven : "---";
						newTitle = "Change\n" + tempString;
						break;
					}
				case "PayMethodIcon":
					{
						newImage = "actions/assets/Icon_PayMethod" + GlobalPaymentStatus.PaymentMethod;
						newTitle = "";
						break;
					}
				default:
					{
						newTitle = "";
						break;
					}
			}
		}

		$SD.setImage(SaleContext, newImage);

		$SD.setTitle(SaleContext, newTitle)
	});
}

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.paymentstatus", ({context, payload}) => 
{
	SaleStatusRegister[context] = payload;
	SaleStatusChanged();
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// StartOptions

StartOptionAction.onKeyDown(({ action, context, device, event, payload }) => {
	if(payload.settings.StartOption == "Start")
	{
		SendStartCommand()
		return;
	}

	StartOptions[payload.settings.StartOption] = payload.settings.CustomData;

});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.start", ({context, payload}) => 
{
	if(payload.settings.StartOption === undefined)
	{
		payload.settings.StartOption = "BusName";
		$SD.setSettings(context, payload.settings)
	}
});

function SendStartCommand()
{
	var Command = "QuickStart"
	Command += " BusName=" + StartOptions["BusName"];
	Command += " ,Weather=" + StartOptions["Weather"];
	Command += " ,Date=" + StartOptions["Date"];
	Command += " ,SpawnInBus=" + StartOptions["SpawnInBus"];
	Command += " ,Map=" + StartOptions["Map"];
	Command += " ,OperatingPlanType=" + StartOptions["OperatingPlanType"];
	Command += " ,OperatingPlan=" + StartOptions["OperatingPlan"];
	Command += " ,Line=" + StartOptions["Line"];
	Command += " ,Stop=" + StartOptions["Stop"];
	Command += " ,Tour=" + StartOptions["Tour"];
	Command += " ,RouteIndex=" + StartOptions["RouteIndex"];

	SendTelemetryCommand(Command);
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Connection Status

ConnectionStatus.onWillAppear(({ action, context, device, event, payload }) =>
{
	AddInterval(context, function() {updateConnectionSatatus(context);});
});

ConnectionStatus.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});



function updateConnectionSatatus(context)
{
	image = "actions/assets/Icon_Error"
	text = "Not\nConnected"

	if(failedConnectionCounter < 10)
	{
		image = "actions/assets/Icon_Connected"
		text = "Connected"
		if(CurrentVehicle != null)
		{
			image = "actions/assets/Icon_Bus"
			text = "In\nBus"
		}
	}

	$SD.setImage(context, image);
	$SD.setTitle(context, text);
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Indicator Control

IndicatorControl.onWillAppear(({ action, context, device, event, payload }) =>
{
	$SD.getSettings(context);

});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.indicatorcontrol", ({context, payload}) => 
{
	var lightName = null;
	var iconOn = null;
	var iconOff = null;

	if(payload.settings.IndicatorSelector === undefined)
	{
		payload.settings.IndicatorSelector = "IndicatorLeft";
		$SD.setSettings(context, payload.settings);
	}

	switch(payload.settings.IndicatorSelector)
	{
		case "IndicatorLeft": 
			lightName = "IndicatorLeft";
			iconOff = "Icon_IndicatorLeftOff";
			iconOn = "Icon_IndicatorLeftOn";
			break;

		case "IndicatorRight":
			lightName = "IndicatorRight";
			iconOff = "Icon_IndicatorRightOff";
			iconOn = "Icon_IndicatorRightOn";
			break;
		
		case "WarningLights":
			lightName = "ButtonLight WarningLights";
			iconOff = "Icon_WarningLightsOff";
			iconOn = "Icon_WarningLightsOn";
			break;
	}
	if(lightName && iconOff && iconOn)
	{
		GlobalCurrentState[context] = -1;
		AddInterval(context, function() {UpdateButtonIcon(lightName, iconOn, iconOff, context) ;});
	}
});

IndicatorControl.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});

IndicatorControl.onKeyDown(({ action, context, device, event, payload }) => 
{
	IndicatorAction = null
	
	switch(payload.settings.IndicatorSelector)
	{
		case "IndicatorLeft": 
			IndicatorAction = "/sendevent?event=IndicatorDown";
			break;

		case "IndicatorRight":
			IndicatorAction = "/sendevent?event=IndicatorUp";
			break;
		
		case "WarningLights":
			IndicatorAction = "/sendevent?event=ToggleWarningLights";
			break;
	}

	if(IndicatorAction)
	{
		SendTelemetryAction(IndicatorAction);
	}
});


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Custom Button
CustomButtonAction.onWillAppear(({ action, context, device, event, payload }) =>
{
	$SD.getSettings(context);

});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.custombutton", ({context, payload}) => 
{
	IconUpdate(context, payload);
});

CustomButtonAction.onWillDisappear(({ action, context, device, event, payload }) =>
{
	RemoveInterval(context);
});

CustomButtonAction.onKeyDown(({ action, context, device, event, payload }) => 
{
	SendCustomButtonAction(action, context, device, event, payload, true);
});

CustomButtonAction.onKeyUp(({ action, context, device, event, payload }) => 
{
	SendCustomButtonAction(action, context, device, event, payload, false);
});

function SendCustomButtonAction(action, context, device, event, payload, bPressed)
{
	switch(payload.settings.ButtonFunctionType)
	{
		case "button":
			try
			{
				if(payload.settings.OnPressAction && bPressed)
				{
					data = JSON.parse(payload.settings.OnPressAction)
					SendTelemetryAction("/setbutton?button=" + data.button + "&state=" + data.state)
				}
				if(payload.settings.OnReleaseAction && !bPressed)
				{
					data = JSON.parse(payload.settings.OnReleaseAction)
					SendTelemetryAction("/setbutton?button=" + data.button + "&state=" + data.state)
				}
			}
			catch
			{
			}
			return;

		case "event":
			try
			{
				var sendeventtype = "/sendevent?event=";
				var Data = payload.settings.OnReleaseAction;
				if(payload.settings.OnPressAction && payload.settings.OnReleaseAction)
				{
					sendeventtype = "/sendeventrelease?event=";
					if(bPressed)
					{
						sendeventtype = "/sendeventpress?event=";
					}
				}
				if(bPressed)
				{
					Data = payload.settings.OnPressAction;
				}
				SendTelemetryAction(sendeventtype + Data);
			}
			catch
			{
			}
			return;
	}
}

function IconUpdate(context, payload)
{
	RemoveIconUpdateData(context);
	if((payload.settings.DefaultIcon && !payload.settings.TrueIcon) || (payload.settings.DefaultIcon && payload.settings.ButtonFeedbackType == "off"))
	{
		$SD.setImage(context, payload.settings.DefaultIcon);
		return;
	}
	if(payload.settings.DefaultIcon && payload.settings.TrueIcon && payload.settings.ButtonFeedbackType != "off" && payload.settings.SourceName)
	{
		var OffIcon = payload.settings.DefaultIcon;
		var OnIcon = payload.settings.TrueIcon;
		var FeedbackType = payload.settings.ButtonFeedbackType;
		var SourceName = payload.settings.SourceName;
		var TrueState = payload.settings.TrueState;

		AddIconUpdateData(FeedbackType, SourceName, TrueState, OffIcon, OnIcon, context);
		return;
	}
	
	$SD.setImage(context, "actions/assets/Icon_Custom");
	
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Light Control Action Functions

LightControlAction.onKeyDown(({ action, context, device, event, payload }) => {
	var lightSelection = payload.settings.LightSelector;
	if(!lightSelection) {
		lightSelection = "Headlight";
	}
	
	// Map light selection to correct event name
	var eventMapping = {
		"Headlight": "ToggleLightSwitch",
		"Main Light": "ToggleMainLight",
		"Traveller Lights": "ToggleTravellerLights",
		"Fog Light Front": "ToggleFogLight",
		"Fog Light Rear": "ToggleFogLightRear",
		"Warning Light": "ToggleWarningLights",
		"Driver Light": "ToggleDriversLight"
	};
	
	var eventName = eventMapping[lightSelection] || "ToggleLightSwitch";
	
	// Use /sendevent like door buttons
	SendTelemetryAction("/sendevent?event=" + eventName);
});

LightControlAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

LightControlAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.lightcontrol", ({context, payload}) => {
	var lightName = payload.settings.LightSelector;
	if(!lightName) {
		lightName = "Headlight";
		payload.settings.LightSelector = "Headlight";
		$SD.setSettings(context, payload.settings);
	}
	
	// Map light selection to LED name and icons
	var lightConfig = {
		"Headlight": {
			led: "LightHeadlight",
			iconOff: "low-beam.png",
			iconOn: "low-beam-c.png"
		},
		"Main Light": {
			led: "LightParking",
			iconOff: "side-markers.png",
			iconOn: "side-markers-c.png"
		},
		"Traveller Lights": {
			led: "LightFlasher",
			iconOff: "high-beam.png",
			iconOn: "high-beam-c.png"
		},
		"Fog Light Front": {
			led: "LightFog",
			iconOff: "fog-lamp-front.png",
			iconOn: "fog-lamp-front-c.png"
		},
		"Fog Light Rear": {
			led: "LightRearFog",
			iconOff: "fog-lamp-rear.png",
			iconOn: "fog-lamp-rear-c.png"
		},
		"Warning Light": {
			led: "DB Warning Light",
			iconOff: "Icon_WarningLightsOff.PNG",
			iconOn: "Icon_WarningLightsOn.PNG"
		},
		"Driver Light": {
			button: "Driver Light",
			iconOff: "driver-light.png",
			iconOn: "driver-light_On.png"
		}
	};
	
	var config = lightConfig[lightName];
	
	// If no specific config, don't set icons (for lights without images yet)
	if(!config) {
		return;
	}
	
	// Set initial icon
	$SD.setImage(context, "actions/assets/" + config.iconOff);
	
	// Start tracking status - use Button State if available, otherwise LED
	if(config.button) {
		// Button-based light (e.g. Interior Light Dim)
		AddInterval(context, function() {
			UpdateButtonState(config.button, "Secondary", config.iconOff, config.iconOn, context);
		});
	} else {
		// LED-based light
		AddInterval(context, function() {
			UpdateButtonIcon(config.led, config.iconOn, config.iconOff, context);
		});
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Wiper Up Action

function UpdateWiperStatus(context) {
	// Display current wiper level
	var levelText = "WIPER\n" + GlobalWiperLevel;
	
	if(GlobalCurrentState[context] != levelText) {
		GlobalCurrentState[context] = levelText;
		$SD.setTitle(context, levelText);
	}
}

WiperUpAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=WiperUp");
	$SD.setImage(context, "actions/assets/wiper-c.png");
	setTimeout(() => {
		$SD.setImage(context, "actions/assets/wiper.png");
	}, 200);
});

WiperUpAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	$SD.setImage(context, "actions/assets/wiper.png");
	AddInterval(context, function() { UpdateWiperStatus(context); });
});

WiperUpAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Wiper Down Action

WiperDownAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=WiperDown");
	$SD.setImage(context, "actions/assets/wiper-c.png");
	setTimeout(() => {
		$SD.setImage(context, "actions/assets/wiper.png");
	}, 200);
});

WiperDownAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	$SD.setImage(context, "actions/assets/wiper.png");
	AddInterval(context, function() { UpdateWiperStatus(context); });
});

WiperDownAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Horn Action

var HornInterval = null;

HornAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Start continuous horn
	if(!HornInterval) {
		SendTelemetryAction("/sendevent?event=Horn");
		HornInterval = setInterval(() => {
			SendTelemetryAction("/sendevent?event=Horn");
		}, 50); // Send every 50ms while held
	}
});

HornAction.onKeyUp(({ action, context, device, event, payload }) => {
	// Stop continuous horn
	if(HornInterval) {
		clearInterval(HornInterval);
		HornInterval = null;
	}
});

HornAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// High Beam Flasher Action (Hold to activate)

var HighBeamInterval = null;

HighBeamFlasherAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Start continuous high beam
	if(!HighBeamInterval) {
		SendTelemetryAction("/sendevent?event=High Beam Flasher On");
		HighBeamInterval = setInterval(() => {
			SendTelemetryAction("/sendevent?event=High Beam Flasher On");
		}, 50); // Send every 50ms while held
	}
});

HighBeamFlasherAction.onKeyUp(({ action, context, device, event, payload }) => {
	// Stop continuous high beam
	if(HighBeamInterval) {
		clearInterval(HighBeamInterval);
		HighBeamInterval = null;
	}
});

HighBeamFlasherAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	AddInterval(context, function() { UpdateButtonIcon("HeadLight Beam On", "passing-c.png", "passing.png", context); });
});

HighBeamFlasherAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
	if(HighBeamInterval) {
		clearInterval(HighBeamInterval);
		HighBeamInterval = null;
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Fixing Brake Toggle Action

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Infos Action (Display Only - Window Heating, Mirror Heating, Stop Request)

InfosAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Display only - no action on click
});

InfosAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	// Start polling for selected info display
	var selection = payload.settings.InfosSelector;
	if(selection) {
		AddInterval(context, function() { UpdateInfoDisplay(context, selection); });
	}
});

InfosAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.infos", ({context, payload}) => {
	var selection = payload.settings.InfosSelector;
	if(!selection) {
		selection = "Window Heating";
		payload.settings.InfosSelector = "Window Heating";
		$SD.setSettings(context, payload.settings);
	}
	
	// Update display immediately when settings change
	UpdateInfoDisplay(context, selection);
});

function UpdateInfoDisplay(context, selection) {
	if(!selection) return;
	
	switch(selection) {
		case "Window Heating":
			UpdateButtonState("Window Heating", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
			break;
		case "Mirror Heating":
			UpdateButtonState("Mirror Heating", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
			break;
		case "Stop Request":
			// Use multi-LED detection for all bus types
			UpdateButtonIconMultiLED(["DB Stop Request", "LED StopRequest", "TachoStopRequest"], 
				"Haltestelle_ON.png", "Haltestelle.png", context);
			break;
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Fuel Display Action

FuelAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Display only - no action
});

FuelAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	AddInterval(context, function() { UpdateFuelDisplay(context); });
});

FuelAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

function UpdateFuelDisplay(context) {
	var currentFuel = Math.round(GlobalCurrentFuel);
	var maxFuel = Math.round(GlobalMaxFuel);
	var percentage = maxFuel > 0 ? Math.round((GlobalCurrentFuel / GlobalMaxFuel) * 100) : 0;
	var warning = GlobalLowFuelWarning ? " ⚠️" : "";
	
	var displayText = "FUEL\n" + currentFuel + " L\n" + percentage + "%" + warning;
	$SD.setTitle(context, displayText);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Passengers Action (Dropdown for Passengers and Doors Info)

PassengersAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Display only - no action on click
});

PassengersAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	var selection = payload.settings.PassengersSelector || "Occupied Seats";
	
	// Store selection in global object
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].PassengersSelector = selection;
	
	// Start interval - it will read from ButtonSettings dynamically
	AddInterval(context, function() {
		var currentSelection = ButtonSettings[context] ? ButtonSettings[context].PassengersSelector : "Occupied Seats";
		UpdatePassengersDisplay(context, currentSelection);
	});
});

PassengersAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
	delete ButtonSettings[context];
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.passengers", ({context, payload}) => {
	var selection = payload.settings.PassengersSelector || "Occupied Seats";
	
	// Update stored selection in ButtonSettings
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].PassengersSelector = selection;
	
	// Update display immediately
	UpdatePassengersDisplay(context, selection);
});

function UpdatePassengersDisplay(context, selection) {
	if(!selection) return;
	
	var displayText = "";
	
	switch(selection) {
		case "Occupied Seats":
			displayText = "SEATS\n" + GlobalNumOccupiedSeats + " / " + GlobalNumSeats;
			break;
		case "Total Seats":
			displayText = "TOTAL\nSEATS\n" + GlobalNumSeats;
			break;
		case "Passenger Load":
			var loadPercent = Math.round(GlobalLoad * 100);
			displayText = "PASSENGER\nLOAD\n" + loadPercent + "%";
			break;
		case "Total Mass":
			var massKg = Math.round(GlobalMass);
			displayText = "TOTAL\nMASS\n" + massKg + " kg";
			break;
		case "Doors Open":
			displayText = "DOORS\nOPEN\n" + GlobalDoorsOpen;
			break;
		case "Passenger Doors":
			var passengerStatus = GlobalPassengerDoorsOpen ? "OPEN" : "CLOSED";
			displayText = "PASSENGER\nDOORS\n" + passengerStatus;
			break;
		case "Luggage Doors":
			var luggageStatus = GlobalLuggageDoorsOpen ? "OPEN" : "CLOSED";
			displayText = "LUGGAGE\nDOORS\n" + luggageStatus;
			break;
		default:
			displayText = "SELECT\nOPTION";
	}
	
	$SD.setTitle(context, displayText);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Scania Lights Action (Fog Lights only - Interior Lights moved to universal Interior Light Control)

ScaniaLightsAction.onKeyDown(({ action, context, device, event, payload }) => {
	var lightSelection = payload.settings.ScaniaLightSelector;
	if(!lightSelection) {
		lightSelection = "Fog Light Front";
	}
	
	// Map selection to event - Scania-specific fog light events
	var eventMapping = {
		"Fog Light Front": "ToggleFogLight",
		"Fog Light Rear": "FogBackLight"
	};
	
	var eventName = eventMapping[lightSelection] || "ToggleFogLight";
	SendTelemetryAction("/sendevent?event=" + eventName);
});

ScaniaLightsAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

ScaniaLightsAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.scaniafoglights", ({context, payload}) => {
	var lightName = payload.settings.ScaniaLightSelector;
	if(!lightName) {
		lightName = "Fog Light Front";
		payload.settings.ScaniaLightSelector = "Fog Light Front";
		$SD.setSettings(context, payload.settings);
	}
	
	// Map light selection to configuration
	if(lightName === "Interior Front Up") {
		// Gedimmt/30% - check Tertiary state
		AddInterval(context, function() {
			UpdateButtonState("InteriorLightControl 1", "Tertiary", "InteriorLight_Off_v2.png", "InteriorLight_On_v2.png", context);
		});
	} else if(lightName === "Interior Front Down") {
		// Hell/100% - check Secondary state
		AddInterval(context, function() {
			UpdateButtonState("InteriorLightControl 1", "Secondary", "InteriorLight_Off_v2.png", "InteriorLight_On_v2.png", context);
		});
	} else if(lightName === "Interior Back Up") {
		// Gedimmt/30% - check Tertiary state
		AddInterval(context, function() {
			UpdateButtonState("InteriorLightControl 2", "Tertiary", "InteriorLight_Off_v2.png", "InteriorLight_On_v2.png", context);
		});
	} else if(lightName === "Interior Back Down") {
		// Hell/100% - check Secondary state
		AddInterval(context, function() {
			UpdateButtonState("InteriorLightControl 2", "Secondary", "InteriorLight_Off_v2.png", "InteriorLight_On_v2.png", context);
		});
	} else if(lightName === "Fog Light Front") {
		// LED-based fog light
		AddInterval(context, function() {
			UpdateButtonIcon("LightFog", "fog-lamp-front-c.png", "fog-lamp-front.png", context);
		});
	} else if(lightName === "Fog Light Rear") {
		// LED-based fog light
		AddInterval(context, function() {
			UpdateButtonIcon("LightRearFog", "fog-lamp-rear-c.png", "fog-lamp-rear.png", context);
		});
	} else if(lightName === "Interior Front Toggle") {
		// LED-based toggle
		AddInterval(context, function() {
			UpdateButtonIcon("Passenger Lights", "indoor-light-on.png", "indoor-light.png", context);
		});
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Engine Info Action (Dropdown for Engine and Driving Info)

EngineInfoAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Display only - no action on click
});

EngineInfoAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	var selection = payload.settings.EngineSelector || "Engine Status";
	
	// Store selection in global object
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].EngineSelector = selection;
	
	// Start interval - it will read from ButtonSettings dynamically
	AddInterval(context, function() {
		var currentSelection = ButtonSettings[context] ? ButtonSettings[context].EngineSelector : "Engine Status";
		UpdateEngineInfoDisplay(context, currentSelection);
	});
});

EngineInfoAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
	// Clean up stored settings
	delete ButtonSettings[context];
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.engineinfo", ({context, payload}) => {
	var selection = payload.settings.EngineSelector || "Engine Status";
	
	// Update stored selection in ButtonSettings
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].EngineSelector = selection;
	
	// Restart interval to ensure it picks up the new selection
	RemoveInterval(context);
	AddInterval(context, function() {
		var currentSelection = ButtonSettings[context] ? ButtonSettings[context].EngineSelector : "Engine Status";
		UpdateEngineInfoDisplay(context, currentSelection);
	});
	
	// Update display immediately
	UpdateEngineInfoDisplay(context, selection);
});

function UpdateEngineInfoDisplay(context, selection) {
	if(!selection) return;
	
	var displayText = "";
	
	switch(selection) {
		case "Engine Status":
			var engineStatus = GlobalEngineStarted ? "RUNNING" : "OFF";
			displayText = "ENGINE\n" + engineStatus;
			break;
		case "Ignition":
			var ignitionStatus = GlobalIgnitionEnabled ? "ON" : "OFF";
			displayText = "IGNITION\n" + ignitionStatus;
			break;
		case "RPM":
			var rpm = Math.round(GlobalRPM);
			displayText = "RPM\n" + rpm;
			break;
		case "Engine Temperature":
			var tempPercent = Math.round(GlobalEngineTemperature * 100);
			displayText = "ENGINE\nTEMP\n" + tempPercent + "%";
			break;
		case "Throttle":
			var throttlePercent = Math.round(GlobalThrottle * 100);
			displayText = "THROTTLE\n" + throttlePercent + "%";
			break;
		case "Gearbox":
			var gear = GlobalGearbox || "N";
			displayText = "GEAR\n" + gear;
			break;
		case "Brake":
			var brakePercent = Math.round(GlobalBrake * 100);
			displayText = "BRAKE\n" + brakePercent + "%";
			break;
		case "Cruise Control":
			var cruiseStatus = GlobalCruiseControlActive ? "ACTIVE" : "OFF";
			displayText = "CRUISE\nCONTROL\n" + cruiseStatus;
			break;
		default:
			displayText = "SELECT\nOPTION";
	}
	
	$SD.setTitle(context, displayText);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Speed Display Action

SpeedDisplayAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Display only - no action
});

SpeedDisplayAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	AddInterval(context, function() { UpdateSpeedDisplay(context); });
});

SpeedDisplayAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

function UpdateSpeedDisplay(context) {
	var speed = Math.round(GlobalSpeed);
	var allowedSpeed = Math.round(GlobalAllowedSpeed);
	
	// Determine icon based on ALLOWED speed (rounded to nearest 10)
	var iconName = "speed_QUESTION.png";
	if(allowedSpeed !== undefined && allowedSpeed >= 0) {
		var roundedSpeed = Math.floor(allowedSpeed / 10) * 10;
		if(roundedSpeed > 120) roundedSpeed = 120;
		iconName = "speed_" + String(roundedSpeed).padStart(3, '0') + ".png";
	}
	
	$SD.setImage(context, "actions/assets/" + iconName);
	
	// Display only speed number
	var displayText = speed + " km/h";
	$SD.setTitle(context, displayText);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Stop Brake Action

StopBrakeAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=StopBrakeOnOff");
});

StopBrakeAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	// Support all bus types:
	// - Solaris: "LED Stop Brake"
	// - Mercedes: "ButtonLight BusStopBrake"
	// - Scania: "LedStopBrake"
	AddInterval(context, function() { 
		var lampValue = GlobalLampData["LED Stop Brake"] || GlobalLampData["ButtonLight BusStopBrake"] || GlobalLampData["LedStopBrake"];
		console.log("[StopBrake] lampValue:", lampValue);
		if(lampValue && lampValue > 0.0) {
			$SD.setImage(context, "actions/assets/HaltestelleBremse_on.png");
		} else {
			$SD.setImage(context, "actions/assets/HaltestelleBremse.png");
		}
	});
});

StopBrakeAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Kneeling/Lifting Control Action

KneelingLiftAction.onKeyDown(({ action, context, device, event, payload }) => {
	var selection = payload.settings.KneelingSelector;
	if(!selection) {
		selection = "Kneeling Toggle";
	}
	
	// Get current toggle state (default to first event)
	var toggleState = payload.settings.ToggleState || "first";
	var eventName = "";
	var newImage = "";
	
	if(selection === "Kneeling Toggle") {
		// Toggle between KneelDown and KneelUp
		if(toggleState === "first") {
			eventName = "KneelDown";
			payload.settings.ToggleState = "second";
			newImage = "actions/assets/kneeling-on.png";  // activated (down)
		} else {
			eventName = "KneelUp";
			payload.settings.ToggleState = "first";
			newImage = "actions/assets/kneeling.png";  // deactivated (up)
		}
	} else if(selection === "Kneel Down") {
		// Direct kneel down event
		eventName = "KneelDown";
		newImage = "actions/assets/kneeling-on.png";
	} else if(selection === "Kneel Up") {
		// Direct kneel up event
		eventName = "KneelUp";
		newImage = "actions/assets/kneeling.png";
	} else if(selection === "Lifting Toggle") {
		// Toggle between LiftUp and LiftDown
		if(toggleState === "first") {
			eventName = "LiftUp";
			payload.settings.ToggleState = "second";
			newImage = "actions/assets/lifting-on.png";  // activated (up)
		} else {
			eventName = "LiftDown";
			payload.settings.ToggleState = "first";
			newImage = "actions/assets/lifting.png";  // deactivated (down)
		}
	} else if(selection === "Lift Up") {
		// Direct lift up event
		eventName = "LiftUp";
		newImage = "actions/assets/lifting-on.png";
	} else if(selection === "Lift Down") {
		// Direct lift down event
		eventName = "LiftDown";
		newImage = "actions/assets/lifting.png";
	} else if(selection === "Lift Reset") {
		// Toggle between LiftReset_Button and ResetLiftReset
		if(toggleState === "first") {
			eventName = "LiftReset_Button";
			payload.settings.ToggleState = "second";
		} else {
			eventName = "ResetLiftReset";
			payload.settings.ToggleState = "first";
		}
	}
	
	// Save toggle state
	$SD.setSettings(context, payload.settings);
	
	// Update image if applicable
	if(newImage) {
		$SD.setImage(context, newImage);
	}
	
	// Send event
	SendTelemetryAction("/sendevent?event=" + eventName);
});

KneelingLiftAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.kneelinglift", ({context, payload}) => {
	var selection = payload.settings.KneelingSelector;
	if(!selection) {
		selection = "Kneeling Toggle";
		payload.settings.KneelingSelector = "Kneeling Toggle";
		$SD.setSettings(context, payload.settings);
	}
	
	// Reset toggle state when selection changes
	if(payload.settings.LastSelection !== selection) {
		payload.settings.ToggleState = "first";
		payload.settings.LastSelection = selection;
		$SD.setSettings(context, payload.settings);
	}
	
	// Set image and text based on selection and current state
	var toggleState = payload.settings.ToggleState || "first";
	var buttonText = "";
	var imagePath = "";
	
	if(selection === "Kneeling Toggle") {
		buttonText = (toggleState === "first") ? "KNEEL ↓" : "KNEEL ↑";
		imagePath = (toggleState === "first") ? "actions/assets/kneeling.png" : "actions/assets/kneeling-on.png";
	} else if(selection === "Kneel Down") {
		buttonText = "KNEEL ↓";
		imagePath = "actions/assets/kneeling-on.png";
	} else if(selection === "Kneel Up") {
		buttonText = "KNEEL ↑";
		imagePath = "actions/assets/kneeling.png";
	} else if(selection === "Lifting Toggle") {
		buttonText = (toggleState === "first") ? "LIFT ↑" : "LIFT ↓";
		imagePath = (toggleState === "first") ? "actions/assets/lifting.png" : "actions/assets/lifting-on.png";
	} else if(selection === "Lift Up") {
		buttonText = "LIFT ↑";
		imagePath = "actions/assets/lifting-on.png";
	} else if(selection === "Lift Down") {
		buttonText = "LIFT ↓";
		imagePath = "actions/assets/lifting.png";
	} else if(selection === "Lift Reset") {
		buttonText = (toggleState === "first") ? "RESET 1" : "RESET 2";
	}
	
	// Check if user wants to show status info (default: true)
	var showStatus = payload.settings.ShowStatus;
	if(showStatus === undefined) {
		showStatus = true;
	}
	
	// Update image if applicable
	if(imagePath) {
		$SD.setImage(context, imagePath);
	}
	
	// Only show status text if checkbox is enabled
	if(showStatus) {
		$SD.setTitle(context, buttonText);
	} else {
		$SD.setTitle(context, "");
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Climate Control Action

ClimateControlAction.onKeyDown(({ action, context, device, event, payload }) => {
	var selection = payload.settings.ClimateSelector;
	if(!selection) {
		selection = "Air Condition Toggle";
	}
	
	// Display-only options don't trigger events
	var displayOptions = ["Fan Speed Display", "Driver Temp Display", "AC Temp Display"];
	if(displayOptions.includes(selection)) {
		return; // Just display, don't send event
	}
	
	var eventMapping = {
		"Air Condition Toggle": "ToggleAirCondition",
		"Temperature Up": "AirconditionPlus",
		"Temperature Down": "AirconditionMinus",
		"Airflow Toggle": "ToggleAirconAirflow",
		"Airflow Left": "AirCon AirflowFakeLeft",
		"Airflow Right": "AirCon AirflowFakeRight",
		"Climate Mode": "ToggleAirconMode1"
	};
	
	var eventName = eventMapping[selection] || "ToggleAirCondition";
	SendTelemetryAction("/sendevent?event=" + eventName);
});

ClimateControlAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	// Start polling for display options
	var selection = payload.settings.ClimateSelector;
	var displayOptions = ["Fan Speed Display", "Driver Temp Display", "AC Temp Display"];
	if(displayOptions.includes(selection)) {
		// Immediately show current value
		UpdateClimateDisplay(context, selection, payload.settings);
		// Start polling for updates
		AddInterval(context, function() { UpdateClimateDisplay(context, selection, payload.settings); });
	}
});

ClimateControlAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.climatecontrol", ({context, payload}) => {
	var selection = payload.settings.ClimateSelector;
	if(!selection) {
		selection = "Air Condition Toggle";
		payload.settings.ClimateSelector = "Air Condition Toggle";
		$SD.setSettings(context, payload.settings);
	}
	
	// Check if user wants to show temperature info
	var showTemperature = payload.settings.ShowTemperature;
	if(showTemperature === undefined) {
		showTemperature = true; // Default to showing temperature
	}
	
	// Check if this is a display option
	var displayOptions = ["Fan Speed Display", "Driver Temp Display", "AC Temp Display"];
	if(displayOptions.includes(selection)) {
		// For display options, update the display immediately
		UpdateClimateDisplay(context, selection, payload.settings);
	} else {
		// For control options, set static text
		var textMapping = {
			"Air Condition Toggle": "AC",
			"Temperature Up": "TEMP +",
			"Temperature Down": "TEMP -",
			"Airflow Toggle": "AIRFLOW",
			"Airflow Left": "AIR ←",
			"Airflow Right": "AIR →",
			"Climate Mode": "START"
		};
		
		var buttonText = textMapping[selection] || "AC";
		
		// Only show text if checkbox is enabled
		if(showTemperature) {
			$SD.setTitle(context, buttonText);
		} else {
			$SD.setTitle(context, "");
		}
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Window Control Action

WindowControlAction.onKeyDown(({ action, context, device, event, payload }) => {
	var selection = payload.settings.WindowSelector;
	if(!selection) {
		selection = "Driver Window Open";
	}
	
	var eventMapping = {
		"Driver Window Open": "DriverWindowOpen",
		"Driver Window Close": "DriverWindowClose",
		"Window Shade Up": "WindowShadeUp",
		"Window Shade Down": "WindowShadeDown",
		"Window Shade Side Up": "WindowShadeSideUp",
		"Window Shade Side Down": "WindowShadeSideDown",
		"Window Shade Front Up": "RightWindowShadeUp",
		"Window Shade Front Down": "RightWindowShadeDown",
		"Window Shade Left Up": "LeftWindowShadeUp",
		"Window Shade Left Down": "LeftWindowShadeDown"
	};
	
	var iconMapping = {
		"Driver Window Open": "actions/assets/window-left-down.png",
		"Driver Window Close": "actions/assets/window-left-up.png",
		"Window Shade Up": "actions/assets/window-left-up.png",
		"Window Shade Down": "actions/assets/window-left-down.png",
		"Window Shade Side Up": "actions/assets/window-left-up.png",
		"Window Shade Side Down": "actions/assets/window-left-down.png",
		"Window Shade Front Up": "actions/assets/window-left-up.png",
		"Window Shade Front Down": "actions/assets/window-left-down.png",
		"Window Shade Left Up": "actions/assets/window-left-up.png",
		"Window Shade Left Down": "actions/assets/window-left-down.png"
	};
	
	// Set icon if available
	if(iconMapping[selection]) {
		$SD.setImage(context, iconMapping[selection]);
	}
	
	var eventName = eventMapping[selection] || "DriverWindowOpen";
	SendTelemetryAction("/sendeventpress?event=" + eventName);
});

WindowControlAction.onKeyUp(({ action, context, device, event, payload }) => {
	var selection = payload.settings.WindowSelector;
	if(!selection) {
		selection = "Driver Window Open";
	}
	
	var eventMapping = {
		"Driver Window Open": "DriverWindowOpen",
		"Driver Window Close": "DriverWindowClose",
		"Window Shade Up": "WindowShadeUp",
		"Window Shade Down": "WindowShadeDown",
		"Window Shade Side Up": "WindowShadeSideUp",
		"Window Shade Side Down": "WindowShadeSideDown",
		"Window Shade Front Up": "RightWindowShadeUp",
		"Window Shade Front Down": "RightWindowShadeDown",
		"Window Shade Left Up": "LeftWindowShadeUp",
		"Window Shade Left Down": "LeftWindowShadeDown"
	};
	
	var eventName = eventMapping[selection] || "DriverWindowOpen";
	SendTelemetryAction("/sendeventrelease?event=" + eventName);
});

WindowControlAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	var selection = payload.settings.WindowSelector || "Driver Window Open";
	var iconMapping = {
		"Driver Window Open": "actions/assets/window-left-down.png",
		"Driver Window Close": "actions/assets/window-left-up.png",
		"Window Shade Up": "actions/assets/window-left-up.png",
		"Window Shade Down": "actions/assets/window-left-down.png",
		"Window Shade Side Up": "actions/assets/window-left-up.png",
		"Window Shade Side Down": "actions/assets/window-left-down.png",
		"Window Shade Front Up": "actions/assets/window-left-up.png",
		"Window Shade Front Down": "actions/assets/window-left-down.png",
		"Window Shade Left Up": "actions/assets/window-left-up.png",
		"Window Shade Left Down": "actions/assets/window-left-down.png"
	};
	
	if(iconMapping[selection]) {
		$SD.setImage(context, iconMapping[selection]);
	}
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.windowcontrol", ({context, payload}) => {
	var selection = payload.settings.WindowSelector;
	if(!selection) {
		selection = "Driver Window Open";
		payload.settings.WindowSelector = "Driver Window Open";
		$SD.setSettings(context, payload.settings);
	}
	
	var iconMapping = {
		"Driver Window Open": "actions/assets/window-left-down.png",
		"Driver Window Close": "actions/assets/window-left-up.png"
	};
	
	if(iconMapping[selection]) {
		$SD.setImage(context, iconMapping[selection]);
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pantograph On Action

PantographOnAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=Activate Pantograph");
});

PantographOnAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	// Start tracking Pantograph status (Secondary = Extended/On)
	AddInterval(context, function() { UpdateButtonState("Pantograph", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context); });
});

PantographOnAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pantograph Off Action

PantographOffAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=Deactivate Pantograph");
});

PantographOffAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	// Start tracking Pantograph status (Primary = Retracted/Off)
	AddInterval(context, function() { UpdateButtonState("Pantograph", "Primary", "Icon_Button_Off.png", "Icon_Button_On.png", context); });
});

PantographOffAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Camera Switch Action

CameraSwitchAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=SwitchCamera");              // Solaris/Mercedes/Scania
	SendTelemetryAction("/sendevent?event=SwitchPreviousCamera");      // VDL Previous
});

CameraSwitchAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// USB Clearance Action

USBClearanceAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=ToggleUSB");
});

USBClearanceAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Set initial icon
	$SD.setImage(context, "actions/assets/USB.png");
	
	// Start tracking USB Clearance status
	AddInterval(context, function() { UpdateButtonIcon("USB_Clearance", "USB_on.png", "USB.png", context); });
});

USBClearanceAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Wheelchair Request Action

WheelchairRequestAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=WheelchairRequest");
});

WheelchairRequestAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Stop Request Action (Display only - no events)

StopRequestAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	AddInterval(context, function() { UpdateStopRequestStatus(context); });
});

StopRequestAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// LED Monitor Action (Display only - monitors any LED status)

LEDMonitorAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	
	var selection = payload.settings.LEDSelect || "Dashboard Brake Assist";
	
	// Store selection in ButtonSettings for dynamic access
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].LEDSelect = selection;
	
	// Start interval - it will read from ButtonSettings dynamically
	AddInterval(context, function() { 
		var currentSelection = ButtonSettings[context] ? ButtonSettings[context].LEDSelect : "Dashboard Brake Assist";
		UpdateLEDMonitor(currentSelection, context); 
	});
});

LEDMonitorAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
	delete ButtonSettings[context];
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.ledmonitor", ({context, payload}) => {
	var selection = payload.settings.LEDSelect;
	if(!selection) {
		selection = "Dashboard Brake Assist";
		payload.settings.LEDSelect = "Dashboard Brake Assist";
		$SD.setSettings(context, payload.settings);
	}
	
	// Update stored selection in ButtonSettings
	if(!ButtonSettings[context]) {
		ButtonSettings[context] = {};
	}
	ButtonSettings[context].LEDSelect = selection;
});

function UpdateLEDMonitor(ledName, context) {
	if(!GlobalLampData || !GlobalLampData.AllLamps) return;
	
	var ledValue = GlobalLampData.AllLamps[ledName];
	
	// LEDs are 0.0 = OFF, >= 0.5 = ON
	if(ledValue >= 0.5) {
		$SD.setImage(context, "actions/assets/Icon_Button_On.png");
	} else {
		$SD.setImage(context, "actions/assets/Icon_Button_Off.png");
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Universal Interior Light Action (Auto-detects bus type)

InteriorLightAction.onKeyDown(({ action, context, device, event, payload }) => {
	console.log("=== INTERIOR LIGHT BUTTON PRESSED ===");
	console.log("Payload:", JSON.stringify(payload));
	console.log("Settings:", JSON.stringify(payload.settings));
	console.log("CurrentVehicle:", CurrentVehicle);
	
	var lightMode = payload.settings.lightMode || "Off";
	
	// Detect bus type from CurrentVehicle (case-insensitive!)
	var busType = "Unknown";
	if (CurrentVehicle) {
		var vehicleUpper = CurrentVehicle.toUpperCase();
		if (vehicleUpper.includes("SOLARIS")) busType = "Solaris";
		else if (vehicleUpper.includes("MERCEDES") || vehicleUpper.includes("ECITARO")) busType = "Mercedes";
		else if (vehicleUpper.includes("VDL") || vehicleUpper.includes("CITEA")) busType = "VDL";
		else if (vehicleUpper.includes("SCANIA")) busType = "Scania";
		else if (vehicleUpper.includes("MAN")) busType = "MAN";
	}
	
	console.log("[Interior Light] Mode:", lightMode, "Bus:", busType, "Vehicle:", CurrentVehicle);
	
	// Send appropriate events based on bus type
	switch(busType) {
		case "Solaris":
			handleSolarisInteriorLight(lightMode);
			break;
		case "Mercedes":
			handleMercedesInteriorLight(lightMode);
			break;
		case "VDL":
			handleVDLInteriorLight(lightMode, context);
			break;
		case "Scania":
			handleScaniaInteriorLight(lightMode);
			break;
		case "MAN":
			handleMANInteriorLight(lightMode, context);
			break;
		default:
			console.log("[Interior Light] Unknown bus type:", CurrentVehicle);
	}
});

function handleSolarisInteriorLight(mode) {
	// Solaris uses /sendevent and has toggle behavior - check state first
	var buttonNames = { "Dim": "Interior Light Dim", "Full": "Interior Light Full", "Left": "Interior Light Left", "Right": "Interior Light Right" };
	var events = { "Dim": "INTLightDim", "Full": "INTLightFull", "Left": "INTLightLeftOnly", "Right": "INTLightRightOnly" };
	
	if (mode === "Off") {
		SendTelemetryAction("/sendevent?event=TogglePassengersLight");
	} else if (events[mode]) {
		var button = GlobalButtonData.find(b => b.Name === buttonNames[mode]);
		if (button && button.State === "Secondary") {
			console.log("[Solaris] Already active - not toggling");
		} else {
			SendTelemetryAction("/sendevent?event=" + events[mode]);
		}
	}
}

function handleMercedesInteriorLight(mode) {
	// Mercedes has 3-level toggle system: Hell <-> Normal <-> Gedimmt
	// EVENTS ARE SWAPPED: Bright makes it DARKER, Dim makes it BRIGHTER!
	console.log("[Mercedes Interior Light] Mode:", mode);
	
	if (mode === "Off") {
		// Toggle main on/off switch
		SendTelemetryAction("/sendevent?event=TogglePassengersLight");
	} else if (mode === "Dim") {
		// Legacy: Send Bright event (SWAPPED - makes it dimmer!)
		SendTelemetryAction("/sendevent?event=InteriorLightBright");
	} else if (mode === "Full") {
		// Legacy: Send Dim event (SWAPPED - makes it brighter!)
		SendTelemetryAction("/sendevent?event=InteriorLightDim");
	} else if (mode === "MercedesToggleBright") {
		// Toggle brighter: Send DIM (swapped!)
		console.log("[Mercedes] Toggle Brighter (send Dim - swapped!)");
		SendTelemetryAction("/sendevent?event=InteriorLightDim");
	} else if (mode === "MercedesToggleDim") {
		// Toggle dimmer: Send BRIGHT (swapped!)
		console.log("[Mercedes] Toggle Dimmer (send Bright - swapped!)");
		SendTelemetryAction("/sendevent?event=InteriorLightBright");
	} else if (mode === "MercedesOnOff") {
		// Main on/off switch
		console.log("[Mercedes] Toggle On/Off");
		SendTelemetryAction("/sendevent?event=TogglePassengersLight");
	}
}

function handleVDLInteriorLight(mode, context) {
	// VDL 3-position switch: Hell (up), Aus (middle), Dim (down)
	// Toggle behavior: Press Hell -> Hell, Press again -> Off, Press Dim -> Dim, Press again -> Off
	console.log("[VDL Interior Light] Mode:", mode, "Context:", context);
	
	// Initialize state for this button if not exists
	if (!VDLLightStates[context]) {
		VDLLightStates[context] = { bright: false, dimmed: false };
	}
	
	var state = VDLLightStates[context];
	
	if (mode === "Dim") {
		// Legacy: Dimmed
		console.log("[VDL] Setting: Dimmed");
		SendTelemetryAction("/sendevent?event=InteriorLightDimmed");
		SendTelemetryAction("/sendeventpress?event=InteriorLightDimmed");
	} else if (mode === "Full") {
		// Legacy: Bright
		console.log("[VDL] Setting: Bright");
		SendTelemetryAction("/sendevent?event=InteriorLightBright");
		SendTelemetryAction("/sendeventpress?event=InteriorLightBright");
	} else if (mode === "VDLBright") {
		// VDL Hell Toggle: If OFF -> Hell, If Hell -> OFF
		if (state.bright) {
			console.log("[VDL Hell] Toggle OFF (Hell -> Aus)");
			SendTelemetryAction("/sendevent?event=InteriorLightOff");
			SendTelemetryAction("/sendeventpress?event=InteriorLightOff");
			state.bright = false;
			state.dimmed = false;
		} else {
			console.log("[VDL Hell] Toggle ON (Aus -> Hell)");
			SendTelemetryAction("/sendevent?event=InteriorLightBright");
			SendTelemetryAction("/sendeventpress?event=InteriorLightBright");
			state.bright = true;
			state.dimmed = false;
		}
	} else if (mode === "VDLDimmed") {
		// VDL Dim Toggle: If OFF -> Dim, If Dim -> OFF
		if (state.dimmed) {
			console.log("[VDL Dim] Toggle OFF (Dim -> Aus)");
			SendTelemetryAction("/sendevent?event=InteriorLightOff");
			SendTelemetryAction("/sendeventpress?event=InteriorLightOff");
			state.dimmed = false;
			state.bright = false;
		} else {
			console.log("[VDL Dim] Toggle ON (Aus -> Dim)");
			SendTelemetryAction("/sendevent?event=InteriorLightDimmed");
			SendTelemetryAction("/sendeventpress?event=InteriorLightDimmed");
			state.dimmed = true;
			state.bright = false;
		}
	} else {
		// Off - release switch to middle
		console.log("[VDL] Setting: Off");
		SendTelemetryAction("/sendevent?event=InteriorLightOff");
		SendTelemetryAction("/sendeventpress?event=InteriorLightOff");
		state.bright = false;
		state.dimmed = false;
	}
}

function handleScaniaInteriorLight(mode) {
	// Scania events are SWAPPED: Up=Dim, Down=Full (opposite of expected!)
	console.log("[Scania Interior Light] Mode:", mode);
	
	if (mode === "Dim") {
		// Dim = send UP event (swapped!)
		console.log("[Scania] Sending: Front/Back UP (Dim)");
		SendTelemetryAction("/sendevent?event=LightingFrontInteriorUp");
		SendTelemetryAction("/sendeventpress?event=LightingFrontInteriorUp");
		SendTelemetryAction("/sendevent?event=LightingBackInteriorUp");
		SendTelemetryAction("/sendeventpress?event=LightingBackInteriorUp");
	} else if (mode === "Full") {
		// Full = send DOWN event (swapped!)
		console.log("[Scania] Sending: Front/Back DOWN (Full)");
		SendTelemetryAction("/sendevent?event=LightingFrontInteriorDown");
		SendTelemetryAction("/sendeventpress?event=LightingFrontInteriorDown");
		SendTelemetryAction("/sendevent?event=LightingBackInteriorDown");
		SendTelemetryAction("/sendeventpress?event=LightingBackInteriorDown");
	} else if (mode === "FrontDim") {
		console.log("[Scania] Sending: Front UP (Dim)");
		SendTelemetryAction("/sendevent?event=LightingFrontInteriorUp");
		SendTelemetryAction("/sendeventpress?event=LightingFrontInteriorUp");
	} else if (mode === "FrontFull") {
		console.log("[Scania] Sending: Front DOWN (Full)");
		SendTelemetryAction("/sendevent?event=LightingFrontInteriorDown");
		SendTelemetryAction("/sendeventpress?event=LightingFrontInteriorDown");
	} else if (mode === "BackDim") {
		console.log("[Scania] Sending: Back UP (Dim)");
		SendTelemetryAction("/sendevent?event=LightingBackInteriorUp");
		SendTelemetryAction("/sendeventpress?event=LightingBackInteriorUp");
	} else if (mode === "BackFull") {
		console.log("[Scania] Sending: Back DOWN (Full)");
		SendTelemetryAction("/sendevent?event=LightingBackInteriorDown");
		SendTelemetryAction("/sendeventpress?event=LightingBackInteriorDown");
	} else {
		// Off - toggle all lights off
		console.log("[Scania] Sending OFF: TogglePassengersLight");
		SendTelemetryAction("/sendevent?event=TogglePassengersLight");
		SendTelemetryAction("/sendeventpress?event=TogglePassengersLight");
	}
}

function handleMANInteriorLight(mode, context) {
	// MAN has 2 separate 3-position switches: Lower Deck and Upper Deck
	// Each switch: Up=Hell, Middle=Aus, Down=Dim
	// Toggle behavior like VDL: Press -> On, Press again -> Off
	console.log("[MAN Interior Light] Mode:", mode, "Context:", context);
	
	// Initialize state for this button if not exists
	if (!MANLightStates[context]) {
		MANLightStates[context] = { lowerBright: false, lowerDimmed: false, upperBright: false, upperDimmed: false };
	}
	
	var state = MANLightStates[context];
	
	if (mode === "Dim") {
		// Legacy: Lower Deck Up (not recommended)
		SendTelemetryAction("/sendeventpress?event=LDPassengersLightUp");
	} else if (mode === "Full") {
		// Legacy: Upper Deck Up (not recommended)
		SendTelemetryAction("/sendeventpress?event=UDPassengersLightUp");
	} else if (mode === "MANLowerBright") {
		// Lower Deck Hell Toggle
		if (state.lowerBright) {
			console.log("[MAN Lower] Toggle OFF (Hell -> Aus)");
			SendTelemetryAction("/sendeventpress?event=TogglePassengersLight");
			state.lowerBright = false;
			state.lowerDimmed = false;
		} else {
			console.log("[MAN Lower] Toggle ON (Aus -> Hell)");
			SendTelemetryAction("/sendeventpress?event=LDPassengersLightUp");
			state.lowerBright = true;
			state.lowerDimmed = false;
		}
	} else if (mode === "MANLowerDimmed") {
		// Lower Deck Dim Toggle
		if (state.lowerDimmed) {
			console.log("[MAN Lower] Toggle OFF (Dim -> Aus)");
			SendTelemetryAction("/sendeventpress?event=TogglePassengersLight");
			state.lowerDimmed = false;
			state.lowerBright = false;
		} else {
			console.log("[MAN Lower] Toggle ON (Aus -> Dim)");
			SendTelemetryAction("/sendeventpress?event=LDPassengersLightDown");
			state.lowerDimmed = true;
			state.lowerBright = false;
		}
	} else if (mode === "MANUpperBright") {
		// Upper Deck Hell Toggle
		if (state.upperBright) {
			console.log("[MAN Upper] Toggle OFF (Hell -> Aus)");
			SendTelemetryAction("/sendeventpress?event=UDPassengersLightDown");
			SendTelemetryAction("/sendeventpress?event=UDPassengersLightDown"); // Double press to go from Hell->Aus
			state.upperBright = false;
			state.upperDimmed = false;
		} else {
			console.log("[MAN Upper] Toggle ON (Aus -> Hell)");
			SendTelemetryAction("/sendeventpress?event=UDPassengersLightUp");
			state.upperBright = true;
			state.upperDimmed = false;
		}
	} else if (mode === "MANUpperDimmed") {
		// Upper Deck Dim Toggle
		if (state.upperDimmed) {
			console.log("[MAN Upper] Toggle OFF (Dim -> Aus)");
			SendTelemetryAction("/sendeventpress?event=UDPassengersLightUp"); // Up from Dim -> Aus
			state.upperDimmed = false;
			state.upperBright = false;
		} else {
			console.log("[MAN Upper] Toggle ON (Aus -> Dim)");
			SendTelemetryAction("/sendeventpress?event=UDPassengersLightDown");
			state.upperDimmed = true;
			state.upperBright = false;
		}
	} else {
		// Off - toggle all lights off
		console.log("[MAN] Setting: Off");
		SendTelemetryAction("/sendeventpress?event=TogglePassengersLight");
		state.lowerBright = false;
		state.lowerDimmed = false;
		state.upperBright = false;
		state.upperDimmed = false;
	}
}

InteriorLightAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
	var lightMode = payload.settings && payload.settings.lightMode ? payload.settings.lightMode : "Off";
	startUniversalInteriorLightTracking(lightMode, context);
});

InteriorLightAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

function startUniversalInteriorLightTracking(lightMode, context) {
	RemoveInterval(context);
	
	// Detect bus type
	var busType = "Unknown";
	if (CurrentVehicle) {
		if (CurrentVehicle.includes("Solaris")) busType = "Solaris";
		else if (CurrentVehicle.includes("Mercedes")) busType = "Mercedes";
		else if (CurrentVehicle.includes("VDL")) busType = "VDL";
		else if (CurrentVehicle.includes("Scania")) busType = "Scania";
		else if (CurrentVehicle.includes("MAN")) busType = "MAN";
	}
	
	// Icon configuration based on mode
	var iconConfig = {
		"Dim": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"Full": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"FrontDim": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"FrontFull": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"BackDim": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"BackFull": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"Left": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"Right": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" },
		"Off": { iconOff: "InteriorLight_Off_v2.png", iconOn: "InteriorLight_On_v2.png" }
	};
	
	var config = iconConfig[lightMode];
	if (!config) return;
	
	// Force update icon (bypass cache)
	$SD.setImage(context, "actions/assets/" + config.iconOff);
	GlobalCurrentState[context] = null; // Reset state to force update
	
	// Start tracking based on bus type
	if (busType === "Solaris" && lightMode !== "Off") {
		var buttonNames = { "Dim": "Interior Light Dim", "Full": "Interior Light Full", "Left": "Interior Light Left", "Right": "Interior Light Right" };
		AddInterval(context, function() {
			UpdateButtonState(buttonNames[lightMode], "Secondary", config.iconOff, config.iconOn, context);
		});
	} else if (busType === "Scania" && lightMode !== "Off") {
		// Scania Front/Back tracking - Dim/Full controls BOTH, separate options for individual
		var buttonName = "";
		var activeState = "";
		
		if (lightMode === "FrontDim" || lightMode === "FrontFull") {
			buttonName = "InteriorLightControl 1";
			activeState = (lightMode === "FrontFull") ? "Secondary" : "Primary"; // Full=Secondary, Dim=stays Primary
		} else if (lightMode === "BackDim" || lightMode === "BackFull") {
			buttonName = "InteriorLightControl 2";
			activeState = (lightMode === "BackFull") ? "Secondary" : "Primary";
		} else if (lightMode === "Dim" || lightMode === "Full") {
			// Track Back control for general Dim/Full (controls both)
			buttonName = "InteriorLightControl 2";
			activeState = (lightMode === "Full") ? "Secondary" : "Primary";
		}
		
		if (buttonName) {
			AddInterval(context, function() {
				UpdateButtonState(buttonName, activeState, config.iconOff, config.iconOn, context);
			});
		}
	} else if (busType === "Mercedes" && (lightMode === "Dim" || lightMode === "Full")) {
		// Mercedes: InteriorLightControl 2 has Dim/Bright states
		AddInterval(context, function() {
			var buttonData = GlobalButtonData.find(b => b.Name === "InteriorLightControl 2");
			if (buttonData) {
				var isDim = (buttonData.State === "InteriorLightDimmState");
				var isBright = (buttonData.State === "InteriorLightBrightState");
				var isOn = isDim || isBright;
				
				// For Dim mode: show ON only when dimmed
				// For Full mode: show ON only when bright
				var showOn = (lightMode === "Dim" && isDim) || (lightMode === "Full" && isBright);
				var newImage = showOn ? config.iconOn : config.iconOff;
				
				if (GlobalCurrentState[context] != newImage) {
					$SD.setImage(context, "actions/assets/" + newImage);
					GlobalCurrentState[context] = newImage;
				}
			}
		});
	} else if (lightMode === "Off") {
		// Track LED for VDL/Solaris (Passenger Lights) or Mercedes (InteriorLightMain LED)
		var ledName = (busType === "Mercedes") ? "InteriorLightMain LED" : "Passenger Lights";
		AddInterval(context, function() {
			UpdateButtonIcon(ledName, config.iconOn, config.iconOff, context);
		});
	}
}

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.interiorlightv2", ({context, payload}) => {
	var lightMode = payload.settings.lightMode || "Off";
	startUniversalInteriorLightTracking(lightMode, context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Universal: Driver Light Action

DriverLightAction.onKeyDown(({ action, context, device, event, payload }) => {
	console.log("[Driver Light] Toggle");
	SendTelemetryAction("/sendevent?event=ToggleDriversLight");
});

DriverLightAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Set initial icon
	$SD.setImage(context, "actions/assets/driver-light.png");
	
	// Start tracking Driver Light button state
	RemoveInterval(context);
	AddInterval(context, function() {
		UpdateButtonState("Driver Light", "Secondary", "driver-light.png", "driver-light_On.png", context);
	});
});

DriverLightAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// VDL-specific: Reading Light Clearance Action

ReadingLightAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=ToggleReadingLightClearance");
	SendTelemetryAction("/sendeventpress?event=ToggleReadingLightClearance");
});

ReadingLightAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Poll ReadingLight button state
	AddInterval(context, function() {
		UpdateButtonState("ReadingLight", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
	});
});

ReadingLightAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Retarder Toggle Action (Engine Brake)

RetarderAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Get current retarder state
	var button = GlobalButtonData.find(b => b.Name === "Retarder");
	if(button) {
		if(button.State === "Secondary") {
			// Currently ON -> Turn OFF
			SendTelemetryAction("/sendevent?event=RetarderOff");
			SendTelemetryAction("/sendeventpress?event=RetarderOff");
		} else {
			// Currently OFF -> Turn ON
			SendTelemetryAction("/sendevent?event=RetarderOn");
			SendTelemetryAction("/sendeventpress?event=RetarderOn");
		}
	} else {
		// Fallback - toggle based on last known state
		if(GlobalCurrentState[context] === "Secondary") {
			SendTelemetryAction("/sendevent?event=RetarderOff");
			SendTelemetryAction("/sendeventpress?event=RetarderOff");
		} else {
			SendTelemetryAction("/sendevent?event=RetarderOn");
			SendTelemetryAction("/sendeventpress?event=RetarderOn");
		}
	}
});

RetarderAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Poll Retarder button state
	AddInterval(context, function() {
		UpdateButtonState("Retarder", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
	});
});

RetarderAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Traction Control (ASR) Toggle Action

TractionControlAction.onKeyDown(({ action, context, device, event, payload }) => {
	// Get current traction control state
	var button = GlobalButtonData.find(b => b.Name === "TractionControl");
	if(button) {
		if(button.State === "Secondary") {
			// Currently ON -> Turn OFF
			SendTelemetryAction("/sendevent?event=ASRThresholdOff");
			SendTelemetryAction("/sendeventpress?event=ASRThresholdOff");
		} else {
			// Currently OFF -> Turn ON
			SendTelemetryAction("/sendevent?event=ASRThresholdOn");
			SendTelemetryAction("/sendeventpress?event=ASRThresholdOn");
		}
	} else {
		// Fallback - toggle based on last known state
		if(GlobalCurrentState[context] === "Secondary") {
			SendTelemetryAction("/sendevent?event=ASRThresholdOff");
			SendTelemetryAction("/sendeventpress?event=ASRThresholdOff");
		} else {
			SendTelemetryAction("/sendevent?event=ASRThresholdOn");
			SendTelemetryAction("/sendeventpress?event=ASRThresholdOn");
		}
	}
});

TractionControlAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Poll TractionControl button state
	AddInterval(context, function() {
		UpdateButtonState("TractionControl", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
	});
});

TractionControlAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// RBL Toggle Action

RBLAction.onKeyDown(({ action, context, device, event, payload }) => {
	SendTelemetryAction("/sendevent?event=RBL");
	SendTelemetryAction("/sendeventpress?event=RBL");
});

RBLAction.onWillAppear(({ action, context, device, event, payload }) => {
	// Poll RBL button state
	AddInterval(context, function() {
		UpdateButtonState("RBL", "Secondary", "Icon_Button_Off.png", "Icon_Button_On.png", context);
	});
});

RBLAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});



// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Light Switch Action (6 positions: Off/Parking/Headlights/High Beam/Fog Front/Fog Rear)

LightSwitchAction.onKeyDown(({ action, context, device, event, payload }) => {
	var mode = payload.settings.LightSwitchMode || "Left";
	
	if(mode === "Left") {
		SendTelemetryAction("/sendeventpress?event=LightSwitchUp");
	} else if(mode === "Down") {
		SendTelemetryAction("/sendeventpress?event=LightSwitchDown");
	}
	// Status mode doesn't send anything
});

LightSwitchAction.onKeyUp(({ action, context, device, event, payload }) => {
	var mode = payload.settings.LightSwitchMode || "Left";
	
	if(mode === "Left") {
		SendTelemetryAction("/sendeventrelease?event=LightSwitchUp");
	} else if(mode === "Down") {
		SendTelemetryAction("/sendeventrelease?event=LightSwitchDown");
	}
});

LightSwitchAction.onWillAppear(({ action, context, device, event, payload }) => {
	$SD.getSettings(context);
});

LightSwitchAction.onWillDisappear(({ action, context, device, event, payload }) => {
	RemoveInterval(context);
});

$SD.onDidReceiveSettings("de.blackmautz.telemetry.all.lightswitchv2", ({context, payload}) => {
	RemoveInterval(context);
	
	var mode = payload.settings.LightSwitchMode;
	if(mode === undefined) {
		mode = "Status";
		payload.settings.LightSwitchMode = "Status";
		$SD.setSettings(context, payload.settings);
	}
	
	// Light switch states in order: Off, Parking Lights, Headlights, High Beam, Front Fog Light, Rear Fog Light
	var lightStates = ["Off", "Parking Lights", "Headlights", "High Beam", "Front Fog Light", "Rear Fog Light"];
	var lightIcons = [
		"actions/assets/side-markers.png",      // 0: Off
		"actions/assets/side-markers-c.png",    // 1: Parking Lights
		"actions/assets/low-beam-c.png",        // 2: Headlights
		"actions/assets/passing-c.png",         // 3: High Beam
		"actions/assets/fog-lamp-rear-c.png",   // 4: Front Fog Light
		"actions/assets/fog-lamp-front-c.png"   // 5: Rear Fog Light
	];
	
	// Update icon periodically
	AddInterval(context, function() {
		if(!GlobalButtonData) return;
		
		var button = GlobalButtonData.find(b => b.Name === "Light Switch");
		if(button) {
			var currentIndex = lightStates.indexOf(button.State);
			if(currentIndex === -1) currentIndex = 0; // Default to Off if state unknown
			
			var iconPath = "";
			
			if(mode === "Left") {
				// Left button shows: next position (one step higher)
				var nextIndex = Math.min(currentIndex + 1, lightIcons.length - 1);
				iconPath = lightIcons[nextIndex];
			} else if(mode === "Down") {
				// Right button shows: previous position (one step lower)
				var prevIndex = Math.max(currentIndex - 1, 0);
				iconPath = lightIcons[prevIndex];
			} else {
				// Status button shows: current position
				iconPath = lightIcons[currentIndex];
			}
			
			if(GlobalCurrentState[context] != iconPath) {
				GlobalCurrentState[context] = iconPath;
				$SD.setImage(context, iconPath);
			}
		}
	});
});


