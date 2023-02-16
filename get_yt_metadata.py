import urllib.request
import json
import urllib
import pprint

# change to your VideoID or change url inparams
VideoID = "7MrRi-2nokM"

params = {"format": "json", "url": "https://www.youtube.com/watch?v=%s" % VideoID}
url = "https://www.youtube.com/oembed"
query_string = urllib.parse.urlencode(params)
url = url + "?" + query_string

with urllib.request.urlopen(url) as response:
    response_text = response.read()
    data = json.loads(response_text.decode())
    pprint.pprint(data)
    print(data['title'])

## There is also ['thumbnail_url'] which possibly if you tooltip over a link could preview. 