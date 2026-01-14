import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['text', 'shared_post', "call", "image"],
      default: 'text'
    },
    // sharedPostId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Post',
    // },
    isRead: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    imgUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 })

const Message = mongoose.model("Message", messageSchema);

export default Message;