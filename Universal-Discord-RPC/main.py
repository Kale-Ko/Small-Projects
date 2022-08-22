import sys
import time
import json
import re
import win32gui
import win32process
import psutil
import DiscordRPC

config = None

rpc = None
currentProcess = None

DiscordRPC.setLoggerEnabled(False)


def loadConfig():
    return json.load("./config.json")


def getForegroundWindow():
    wid = win32gui.GetForegroundWindow()
    _, pid = win32process.GetWindowThreadProcessId(wid)

    process = psutil.Process(pid)

    return {"processID": pid, "windowID": wid, "title": win32gui.GetWindowText(wid), "executable": process.exe(), "executableName": process.name(), "startup": " ".join(process.cmdline())}


def updateRPC():
    global config
    global rpc
    global currentProcess

    window = getForegroundWindow()

    if len(sys.argv) > 1 and sys.argv[1] == "--debug":
        if window != None:
            print(window["executableName"] + ": " + window["title"])
        else:
            print("No window")

    if window == None:
        if rpc != None:
            rpc.close()

            rpc = None

        return

    rpcSet = False

    for application in config["applications"]:
        matches = True

        if "title" in application["matches"] and re.match(application["matches"]["title"], window["title"]) == None:
            matches = False

        if "process" in application["matches"] and re.match(application["matches"]["process"], window["executableName"]) == None:
            matches = False

        if matches:
            state = None
            if "state" in application:
                state = application["state"]

            details = None
            if "details" in application:
                details = application["image"]

            image = None
            if "image" in application:
                image = application["image"]

            smallImage = None
            if "smallImage" in application:
                smallImage = application["smallImage"]

            if "states" in application:
                for appState in application["states"]:
                    matches = True

                    if "title" in appState["matches"] and re.match(appState["matches"]["title"], window["title"]) == None:
                        matches = False

                    if "process" in appState["matches"] and re.match(appState["matches"]["process"], window["executableName"]) == None:
                        matches = False

                    if matches:
                        if "state" in appState:
                            state = appState["state"]

                        if "details" in appState:
                            details = appState["details"]

                        if "image" in appState:
                            image = appState["image"]

                        if "smallImage" in appState:
                            smallImage = appState["smallImage"]

            rpcSet = True

            if currentProcess == None or currentProcess != window["processID"]:
                if rpc != None:
                    rpc.close()

                rpc = DiscordRPC.RPC.Set_ID(application["id"])
                currentProcess = window["processID"]

                rpc.set_activity(
                    state=state,
                    details=details,
                    large_image=image,
                    small_image=smallImage,
                    large_text=application["name"],
                    small_text=application["name"],
                    timestamp=round(time.time())
                )

    if not rpcSet and rpc != None:
        rpc.close()

        rpc = None
        currentProcess = None


config = loadConfig()

try:
    while True:
        updateRPC()

        time.sleep(10)
except KeyboardInterrupt:
    if rpc != None:
        rpc.close()

    sys.exit(0)
