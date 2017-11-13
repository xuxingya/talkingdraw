from __future__ import division

from flask import Flask, jsonify, render_template, request, Response, stream_with_context
from transcribe import MicrophoneStream
from flask_socketio import SocketIO, emit

import re
import sys

from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
import pyaudio
from six.moves import queue

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
# speech_results = queue.Queue()
# on_speech = False


def listen_loop(responses):
    print("begin loop")
    for response in responses:
        if not response.results:
            continue
        result = response.results[0]
        if not result.alternatives:
            continue
        alternative = result.alternatives[0]
        transcript = alternative.transcript
        if not result.is_final:
            print(transcript)

            socketio.emit('server_response', {'data': transcript})
            # speech_results.put(transcript)

        else:
            print(transcript)
            socketio.emit('server_response', {'data': transcript})
            # speech_results.put(transcript)
            if re.search(r'\b(exit|quit)\b', transcript, re.I):
                print('Exiting..')
                break

@app.route("/")
def index():
    return render_template('index.html')


@socketio.on('connect_event')
def on_connect(msg):
    emit('server_response', {'data': msg['data']})

# @socketio.on('server_response')
# def speech_result(msg):
#     pass


@socketio.on('speech_start')
def speech_recognition():
    RATE = 16000
    CHUNK = int(RATE / 10)  # 100ms
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

    #     # Return the time offsets
    #     # word_timestamp = []
    #     # for word_info in alternative.words:
    #     #     word = word_info.word
    #     #     start_time = word_info.start_time.seconds + word_info.start_time.nanos * 1e-9
    #     #     end_time = word_info.end_time.seconds + word_info.end_time.nanos * 1e-9
    #     #     word_timestamp.append((word, start_time, end_time))

    # def on_result():
    #     while on_speech:
    #         while True:
    #             try:
    #                 speech = speech_results.get(block=False)
    #                 if speech is None:
    #                     return
    #                 socketio.emit('speech_result', {data: speech})
    #             except queue.Empty:
    #                 break


def main():
    socketio.run(app, port=8080, debug=True)


if __name__ == '__main__':
    main()
