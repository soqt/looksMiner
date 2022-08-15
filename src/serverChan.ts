import axios from "axios"

const {
    SERVER_CHAN: serverChainApi
} = process.env

const endpoint = "https://sctapi.ftqq.com"

const pushMessage = async(title: string, content?: string) => {
    try {
        await axios({
            url: `${endpoint}/${serverChainApi!}.send`,
            method: 'post',
            data: {
                title,
                desp: content
            },
            headers: { "Content-Type": "multipart/form-data" },
        })
    } catch (err) {
        console.log(err);
    }
}

export { pushMessage }
