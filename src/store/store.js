import { configureStore } from '@reduxjs/toolkit'
import videoUrlSlice from './videoUrlSlice'
import roomSlice from './roomSlice'
import userSlice from './userSlice'

export const store = configureStore({
    reducer: {
        videoUrl: videoUrlSlice,
        roomInfo: roomSlice,
        userInfo: userSlice
    },
})