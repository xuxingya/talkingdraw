from __future__ import division

from flask import Flask, jsonify, render_template, request, Response, stream_with_context
from transcribe import MicrophoneStream
from flask_socketio import SocketIO, emit
from search import Search_Engine

import re
import sys
import eventlet
import datetime
import logging


from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
import pyaudio
from six.moves import queue
import pickle

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
gestures = []
iconIndex = {}
language = 'en'
#language = 'jp'

# logging config
# filename = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.log'
# logging.basicConfig(filename = filename,
#     filemode = 'w',
#     format = '%(asctime)s: %(message)s',
#     level= logging.INFO)

def load_dict(name):
    with open('data/'+name+'.pkl', 'rb') as f:
        return pickle.load(f)
    
def speech_recognition():
    RATE = 16000
    CHUNK = int(RATE / 10)  # 100ms
    if language == 'en':
        language_code = 'en'
    elif language == 'jp':
        language_code = 'ja-JP'  # a BCP-47 language tag

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
        listen_loop(responses)
        # try:
        #     listen_loop(responses)
        # except Exception as exception:
        #     assert type(exception).__name__
            # print("Unexpected error:", sys.exc_info()[0], flush = True)
            # logging.error('speech limit time exceed')
            # socketio.emit('speech_state', {'data': 'speech recognition error'})     

def listen_loop(responses):
    hasrun = False 
    gestureindex = 0
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
            # logging.info('speak start: %s', speaktime)
            hasrun = True
            # print("startbutton_time "+str(startbutton_time), flush=True) 
            # print("first speak time "+ str(speaktime), flush=True)
        if not result.is_final:
            socketio.emit('interim_response', {'data': transcript})
            eventlet.sleep(0.1)        
        else:
            socketio.emit('final_response', {'data': transcript})
            eventlet.sleep(0.1)  
            # logging.info('speech result: %s',transcript)
            word_timestamp = []
            for word_info in alternative.words:
                word = word_info.word
                start_time = word_info.start_time.seconds + word_info.start_time.nanos * 1e-9
                end_time = word_info.end_time.seconds + word_info.end_time.nanos * 1e-9
                word_timestamp.append([word, start_time, end_time])
            # logging.info('word_timestamp: %s',word_timestamp)
            print(word_timestamp, flush = True)
            currentgestures = gestures[gestureindex:]
            gestureindex = len(currentgestures)
            # logging.info('gesture_timestamp: %s', currentgestures)
            ksearch = Search_Engine(word_timestamp, currentgestures, language,iconIndex)
            k_results = ksearch.get_icons()
            print(k_results, flush = True)
            # if keyword_results:
            #     print(keyword_results, flush = True)
            # for unitword in word_timestamp:
            #     print(unitword, flush=True)
            if re.search(r'\b(exit|quit)\b', transcript, re.I):
                print('Exiting..')
                break
def test():
    currentgestures = [(2.748, 4.638)]
    word_timestamp=[['this', 0.4, 0.9], ['is', 0.9, 1.2], ['my', 1.2, 1.4], ['computer', 1.4, 2.1], ['on', 2.1, 2.6], ['the', 2.6, 2.9], ['cloud', 2.9, 3.3]]
    ksearch = Search_Engine(word_timestamp, currentgestures, language,iconIndex)
    k_results = ksearch.get_icons()
    return k_results

@app.route("/")
def index():
    return render_template('index.html')

@socketio.on('connect_event')
def on_connect(msg):
    data = msg['data']
    global iconIndex
    iconIndex = load_dict('icondata')
    if data == 'connected':
        emit('interim_response', {'data': data})

@socketio.on('speech_event')
def on_speech(msg):
    global startbutton_time 
    startbutton_time = datetime.datetime.now()
    # logging.info('speech start: %s', str(startbutton_time))
    global gestures
    gestures = []
    result = test()
    keys = result[0]
    ranks = result[1]
    emit('suggestion', {'keys':keys,'ranks': ranks})
    # eventlet.spawn(speech_recognition)
     
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