import React from 'react'
import { UserOutlined } from '@ant-design/icons'
import { Row, Col } from 'antd';
import './comment.css'
import { Input, Button, message } from 'antd';
import '../../components/config/config'
class Comment extends React.Component {
    constructor(props) {
        super(props)
        this.handleSend = this.handleSend.bind(this)
        this.state = {
            msg: [],
            unavailable: false
        }
    }
    handleSend() {
        let msg = document.getElementById("msg").value
        let username = localStorage.getItem("username")
        console.log(msg)
        if (username) {
            if (msg) {
                let url = `${window.host}/comment?msg=${msg}&username=${username}`
                fetch(url, {
                    method: "POST",
                    headers: window.headers
                }).then(res => {
                    return res.json()
                }).then(json => {
                    message.success(json.message)
                    window.location.href = "/"
                }).catch(() => {
                    message.error("Comments are unavailable: the backend is not running.")
                })
            } else {
                message.warn("Send content cannot be empty!")
            }
        } else {
            message.warn("Please Log In !")
        }
    }

    componentDidMount() {
        let url = `${window.host}/getcomment`
        fetch(url, {
            method: "POST",
            headers: window.headers
        }).then(res => {
            if (!res.ok) throw new Error("Comments request failed")
            return res.json()
        }).then(json => {
            let marr = []
            for (let i in json.data) {
                let arr = []
                arr.push(json.data[i].id)
                arr.push(json.data[i].username)
                arr.push(json.data[i].comment)
                arr.push(json.data[i].mtime)
                marr.push(arr)
            }
            this.setState({
                msg: marr,
                unavailable: false
            })
        }).catch(() => {
            this.setState({ unavailable: true })
        })
    }

    render() {
        return (
            <Row style={{ marginLeft: 50 }} className="comment-box">
                <Col spane={24}>
                    <div style={{ height: 15, borderBottom: "2px solid rgb(190, 200, 210)" }}></div>
                    <div className="comment-content-box">
                        <div style={{ width: 15, borderRight: "2px solid rgb(190, 200, 210)", marginTop: -15, height: 650 }}></div>
                        <div className="b-box">
                            <div className="comment-title">Comment</div>
                            {this.state.unavailable && (
                                <p role="status">Comments are unavailable because the backend is not running.</p>
                            )}
                            {
                                this.state.msg.map((el, index) => {
                                    return (
                                        <div className="comment-content">
                                        <UserOutlined style={{ width: 50, height: 50, backgroundColor: "white", borderRadius: 200, fontSize: 43, textAlign: "center", border: "1px solid gray", marginLeft: -20 }} />
                                        <div className="mycomment">
                                            <div className="mycomment-time">
                                                <div>{el[1]}</div>
                                                <div>{el[3]}</div>
                                            </div>
                                            {/* <div className="mycomment-title">
                                                Lorem ipsum dolor sit amet
                                            </div> */}
                                            <div className="mycomment-my">
                                                {el[2]}
                                            </div>
                                        </div>
                                    </div>
                                    )
                                })
                            }
                           
                            <div className="mylast">
                                <div className="comment-content">
                                    <UserOutlined style={{ width: 50, height: 50, backgroundColor: "white", borderRadius: 100, fontSize: 43, textAlign: "center", border: "1px solid gray", marginLeft: -20 }} />
                                    <Input disabled={this.state.unavailable} placeholder="Type something" className="sendMsg" id="msg" />
                                </div>
                                <div>
                                    <Button disabled={this.state.unavailable} size="small" className="send-btn" onClick={this.handleSend}>send</Button>
                                </div>
                            </div>

                        </div>
                    </div>
                </Col>
            </Row>
        )
    }
}

export default Comment