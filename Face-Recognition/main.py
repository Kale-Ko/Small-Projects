import sys
import cv2
import numpy
import flask
import urllib
import tempfile

debug = True

camera = False
image = False

maxWidth = 720
maxDisplayWidth = 1280

faceCascade = cv2.CascadeClassifier("cascades/face.xml")
eyeCascade = cv2.CascadeClassifier("cascades/eyes.xml")
mouthCascade = cv2.CascadeClassifier("cascades/mouth.xml")
noseCascade = cv2.CascadeClassifier("cascades/nose.xml")


class Detection:
    x = 0
    y = 0

    w = 0
    h = 0

    certainty = 0

    def __init__(self, x, y, w, h, certainty):
        self.x = x
        self.y = y

        self.w = w
        self.h = h

        self.certainty = certainty


def drawrect(frame, x, y, width, height, color=(0, 0, 0), ):
    color = (color[2], color[1], color[0])

    cv2.rectangle(frame, (x, y), (x + width, x + height), color, 2)


def drawsphere(frame, x, y, radius, color=(0, 0, 0), ):
    color = (color[2], color[1], color[0])

    cv2.circle(frame, (x + int(radius / 2), y + int(radius / 2)), int(radius / 2), color, 2)


def rectinrect(x, y, w, h, x2, y2, w2, h2):
    return x < x2 < (x2 + w2) < (x + w) and y < y2 < (y2 + h2) < (y + h)


def findfaces(frame):
    height, width, channels = frame.shape

    if width > maxWidth:
        frame = cv2.resize(frame, (maxWidth, int((maxWidth / width) * height)))

    detections = []

    rawfaces = faceCascade.detectMultiScale(frame, scaleFactor=1.5, minNeighbors=5, minSize=(50, 50))
    raweyes = eyeCascade.detectMultiScale(frame, scaleFactor=1.5, minNeighbors=5, minSize=(30, 30))
    rawmouth = mouthCascade.detectMultiScale(frame, scaleFactor=1.5, minNeighbors=5, minSize=(50, 50))
    rawnose = noseCascade.detectMultiScale(frame, scaleFactor=1.5, minNeighbors=5, minSize=(50, 50))

    for (x, y, w, h) in rawfaces:
        certainty = 4

        if debug:
            drawrect(frame, x, y, w, h, color=(80, 80, 80))

        for (x2, y2, w2, h2) in rawfaces:
            if rectinrect(x, y, w, h, x2, y2, w2, h2):
                certainty = float("-inf")

        for (x2, y2, w2, h2) in raweyes:
            if debug:
                drawrect(frame, x2, y2, w2, h2, color=(80, 80, 200))

            if rectinrect(x, y, w, h, x2, y2, w2, h2):
                certainty += 1

        for (x2, y2, w2, h2) in rawmouth:
            if debug:
                drawrect(frame, x2, y2, w2, h2, color=(200, 80, 80))

            if rectinrect(x, y, w, h, x2, y2, w2, h2):
                certainty += 2

        for (x2, y2, w2, h2) in rawnose:
            if debug:
                drawrect(frame, x2, y2, w2, h2, color=(80, 200, 80))

            if rectinrect(x, y, w, h, x2, y2, w2, h2):
                certainty += 2

        detections.append(Detection(x, y, w, h, certainty))

    for detection in detections:
        if detection.certainty <= 0:
            continue
        elif detection.certainty < 5:
            drawsphere(frame, detection.x, detection.y, detection.w, color=(255, 0, 0))
        elif detection.certainty < 8:
            drawsphere(frame, detection.x, detection.y, detection.w, color=(255, 255, 0))
        elif detection.certainty >= 8:
            drawsphere(frame, detection.x, detection.y, detection.w, color=(0, 255, 0))

    height, width, channels = frame.shape

    if width > maxDisplayWidth:
        frame = cv2.resize(frame, (maxDisplayWidth, int(
            (maxDisplayWidth / width) * height)))

    return frame


if sys.argv.__len__() > 1:
    if sys.argv[1] == "-stream":
        app = flask.Flask("Face Recognition")

        camera = cv2.VideoCapture(0)

        @app.route("/", methods=["GET"])
        def index():
            return flask.send_file("index.html")

        @app.route("/proccess_image", methods=["POST"])
        def proccess_image():
            data = flask.request.get_data().decode("utf-8")
            if data.startswith("data:"):
                data = urllib.request.urlopen(data)
                data = numpy.asarray(bytearray(data.read()), dtype="uint8")
                data = cv2.imdecode(data, cv2.IMREAD_COLOR)
                cv2.imwrite(tempfile.gettempdir() + "\\lastimage.jpg", findfaces(data))

                return "200 Ok"
            else:
                return "400 Invalid request"

        @app.route("/get_image", methods=["GET"])
        @app.route("/get_image2", methods=["GET"])
        def get_image():
            image = cv2.imread(tempfile.gettempdir() + "\\lastimage.jpg")

            if image.any():
                (flag, encodedimage) = cv2.imencode(".jpg", image)
                return flask.Response(bytearray(encodedimage), mimetype="image/jpeg")
            else:
                image = numpy.zeros((360, 640, 3), dtype=numpy.uint8)
                cv2.putText(image, "Getting video..", (72, 196), cv2.FONT_HERSHEY_COMPLEX, 2, (255, 255, 255), thickness=6, bottomLeftOrigin=False)

                (flag, encodedimage) = cv2.imencode(".jpg", image)
                return flask.Response(bytearray(encodedimage), mimetype="image/jpeg")

        app.run(host="0.0.0.0", port=8000, ssl_context="adhoc")
    elif sys.argv[1] == "-webcam":
        camera = cv2.VideoCapture(0)
    elif sys.argv[1] == "--webcam":
        camera = cv2.VideoCapture(int(sys.argv[2]))
    elif sys.argv[1] == "--image":
        image = sys.argv[2]
    else:
        print("Usage [-webcam, --webcam (cameraid), --image (filename), -stream]")

        sys.exit(1)
else:
    print("Usage [-stream, -webcam, --webcam (cameraid), --image (filename), -stream]")

    sys.exit(1)


window = "Face Recognition"

while True:
    frame = False

    if camera:
        ret, frame = camera.read()
    elif image:
        frame = cv2.imread(image)
    else:
        break

    frame = findfaces(frame)

    cv2.imshow(window, frame)

    if image:
        cv2.waitKey()

        break

    key = cv2.waitKey(1)
    if (key in [113, 27]):
        break

cv2.destroyWindow(window)
if camera:
    camera.release()
