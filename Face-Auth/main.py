import time
import cv2
import face_recognition

image_name = "./face.jpg"
scale = 1

print("Loading data..")

video_source = cv2.VideoCapture(0)

known_image = face_recognition.load_image_file(image_name)
known_face_encoding = face_recognition.face_encodings(known_image)[0]

print("Looking for face..")

while True:
    _, frame = video_source.read()

    if scale != 1:
        frame = cv2.resize(frame, (0, 0), fx=scale, fy=scale)

    frame = frame[:, :, ::-1]

    face_locations = face_recognition.face_locations(frame)
    face_encodings = face_recognition.face_encodings(frame, face_locations)

    match = False

    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces([known_face_encoding], face_encoding)

        if True in matches:
            match = True

    if match:
        break

    time.sleep(0.005)

print("Found face!")
