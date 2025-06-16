import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.exceptions import DenyConnection
from asgiref.sync import sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # get scope user
        user = self.scope["user"]

        # check authentication in a thread
        is_auth = await sync_to_async(lambda: user.is_authenticated)()
        if not is_auth:
            raise DenyConnection("User not authenticated")

        # now safe to grab user.id
        self.group_name = f"user_{user.id}_notifications"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # if you really want logging, only print primitives:
        print(f"WebSocket connected for user id: {user.id}")

    async def disconnect(self, close_code):
        user = self.scope["user"]
        is_auth = await sync_to_async(lambda: user.is_authenticated)()
        if is_auth:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        print(f"WebSocket disconnected for user id: {user.id}")

    async def send_notification(self, event):
        notification = event['notification']
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'id': notification['id'],
            'message': notification['message'],
            'link': notification['link'],
            'created_at': notification['created_at'],
        }))
