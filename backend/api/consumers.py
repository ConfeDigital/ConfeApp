# users/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class UserUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_authenticated:
            self.group_name = f"user_{user.id}_updates"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_user_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'data': event['data']
        }))
