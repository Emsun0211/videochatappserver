import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";

const rooms: Record<string, string[]> = {};
const chats: Record<string, IMessage[]> = {};

interface IRoomParams {
	roomId: string;
	peerId: string;
}
interface IMessage {
	content: string;
	author?: string;
	timestamp: number;
}

export const roomHandler = (socket: Socket) => {
	const createRoom = () => {
		const roomId = uuidV4();
		rooms[roomId] = [];
		socket.emit("room-created", { roomId });

		console.log("user created  the room");
	};

	const joinRoom = ({ roomId, peerId }: IRoomParams) => {
		if (!rooms[roomId]) rooms[roomId] = [];
		socket.emit("get-messages", chats[roomId]);
		console.log(`user ${peerId} joined the room  ${roomId}`);
		rooms[roomId].push(peerId);
		socket.join(roomId);
		socket.to(roomId).emit("user-joined", { peerId });
		socket.emit("get-users", { roomId, participants: rooms[roomId] });

		socket.on("disconnect", () => {
			console.log(`user ${peerId} disconnected the room ${roomId}`);
			leaveRoom({ roomId, peerId });
		});
	};

	const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
		rooms[roomId] = rooms[roomId].filter((id) => id !== peerId);
		socket.to(roomId).emit("user-disconnected", peerId);
	};
	const startSharing = ({ roomId, peerId }: IRoomParams) => {
		socket.to(roomId).emit("user-started-sharing", peerId);
	};
	const stopSharing = (roomId: string) => {
		socket.to(roomId).emit("user-stoped-sharing");
	};

	const addMessage = (roomId: string, messageData: IMessage) => {
		console.log({ messageData });
		if (chats[roomId]) {
			chats[roomId].push(messageData);
		} else chats[roomId] = [messageData];
		socket.to(roomId).emit("message-added", messageData);
	};

	socket.on("create-room", createRoom);
	socket.on("join-room", joinRoom);
	socket.on("start-sharing", startSharing);
	socket.on("start-sharing", stopSharing);
	socket.on("send-message", addMessage);
};
