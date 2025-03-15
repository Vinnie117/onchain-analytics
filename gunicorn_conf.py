bind = "0.0.0.0:8000"
workers = 2 # multiprocessing.cpu_count() * 2 + 1
preload_app = False
accesslog = "http_requests.log" # '-' means log to stdout.
syslog = True
disable_redirect_access_to_syslog = True
max_requests = 1200 # number of http requests to worker restarts (default is 0 means automatic worker restarts are disabled.)
max_requests_jitter = 50 # randomness to prevent all workers restarting at the same time