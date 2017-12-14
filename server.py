from __future__ import division

from flask import Flask, jsonify, render_template, request, Response, stream_with_context
from transcribe import MicrophoneStream
from flask_socketio import SocketIO, emit

import re
import sys
import eventlet
import datetime

from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
import pyaudio
from six.moves import queue

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
gestures = []


def speech_recognition():
    RATE = 16000
    CHUNK = int(RATE / 10)  # 100ms
    language_code = 'en'  # a BCP-47 language tag

    client = speech.SpeechClient()
    config = types.RecognitionConfig(
        encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=RATE,
        language_code=language_code,
        enable_word_time_offsets=True)
    streaming_config = types.StreamingRecognitionConfig(
        config=config,
        interim_results=True)

    with MicrophoneStream(RATE, CHUNK) as stream:
        audio_generator = stream.generator()
        requests = (types.StreamingRecognizeRequest(audio_content=content)
                    for content in audio_generator)
        responses = client.streaming_recognize(streaming_config, requests)
        # try:
        listen_loop(responses)
        # except:
        #     print("Unexpected error:", sys.exc_info()[0], flush = True)
        #     socketio.emit('speech_state', {'data': 'speech recognition error'})     

def run_once(f):
    def wrapper(*args, **kwargs):
        if not wrapper.has_run:
            wrapper.has_run = True
            return f(*args, **kwargs)
    wrapper.has_run = False
    return wrapper

@ run_once
def check_time():
    return datetime.datetime.now()

def gesture_search(gesture, word_timestamp, speaktime):
    # subtime = (speaktime - startbutton_time).total_seconds()
    # print("subtime is"+str(subtime), flush = True)
    # gesture_trim = (gesture[0]-subtime, gesture[1]-subtime)
    return gesture

def gestures_search(word_timestamp, speaktime):
    print("gestures is "+ str(gestures), flush=True)
    if not word_timestamp or not speaktime or not gestures:
        return None
    keywords = []
    for gesture in gestures:
        # the algrithm to search icon keyword in sentence
        keywords.append(gesture_search(gesture, word_timestamp, speaktime))
    return keywords

def listen_loop(responses):
    hasrun = False 
    for response in responses:
        if not response.results:
            continue
        result = response.results[0]
        if not result.alternatives:
            continue
        alternative = result.alternatives[0]
        transcript = alternative.transcript
        if not hasrun:
            speaktime = datetime.datetime.now()
            hasrun = True
            print("startbutton_time "+str(startbutton_time), flush=True) 
            print("first speak time "+ str(speaktime), flush=True)
        if not result.is_final:
            socketio.emit('interim_response', {'data': transcript})      
        else:
            socketio.emit('final_response', {'data': transcript})
            word_timestamp = []
            for word_info in alternative.words:
                word = word_info.word
                start_time = word_info.start_time.seconds + word_info.start_time.nanos * 1e-9
                end_time = word_info.end_time.seconds + word_info.end_time.nanos * 1e-9
                word_timestamp.append([word, start_time, end_time])
            keyword_results = gestures_search(word_timestamp, speaktime)
            # if keyword_results:
            #     print(keyword_results, flush = True)
            for unitword in word_timestamp:
                print(unitword, flush=True)
            if re.search(r'\b(exit|quit)\b', transcript, re.I):
                print('Exiting..')
                break
        eventlet.sleep(0.2)  

@app.route("/")
def index():
    return render_template('index.html')

@socketio.on('connect_event')
def on_connect(msg):
    data = msg['data']
    if data == 'connected':
        emit('interim_response', {'data': data})

@socketio.on('speech_event')
def on_speech(msg):
    global startbutton_time
    startbutton_time = datetime.datetime.now()
    eventlet.spawn(speech_recognition)

        


@app.route('/command', methods=["GET", "POST"])
def on_pen():
    global gestures
    starttime = float(request.form['starttime'])
    endtime = float(request.form['endtime'])
    gestures.append((starttime, endtime))
    return "pentime received"



def main():
    socketio.run(app, port=8080, debug=True)


if __name__ == '__main__':
    main()