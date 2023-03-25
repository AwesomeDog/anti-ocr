const random = (min, max) => Math.round(Math.random() * (max - min)) + min
const emoji64Encode = (s) => Base64.encode(s).split('').map(c => String.fromCodePoint(c.charCodeAt(0) + (128512 - 43))).join('')
const emoji64Decode = (e) => Base64.decode([...e].reduce((acc, cur) => acc + String.fromCodePoint(cur.codePointAt(0) - (128512 - 43)), ''))
const emoji64Auto = (s) => s.codePointAt(0) >= (128512 - 43) ? emoji64Decode(s) : emoji64Encode(s)

function App () {
  const [oldImg, setOldImg] = React.useState(null)
  const [newImg, setNewImg] = React.useState(null)
  const [userText, setUserText] = React.useState(null)

  const [lineThickness, setLineThickness] = React.useState(null)
  const [pointSize, setPointSize] = React.useState(null)
  const [pointDensity, setPointDensity] = React.useState(null)
  const [fillColor, setFillColor] = React.useState(null)
  const [fontSize, setFontSize] = React.useState(null)
  const [fontWeight, setFontWeight] = React.useState(null)
  const [lineLength, setLineLength] = React.useState(null)

  const [ocrNewImg, setOcrNewImg] = React.useState(true)

  const canvasRef = React.useRef(null)

  const resetArgs = () => {
    setLineThickness(1)
    setPointSize(1)
    setPointDensity(40)
    setFillColor('red')
    setFontSize(16)
    setFontWeight('normal')
    setLineLength(40)
  }

  function blurImage () {
    const image = new Image()
    image.onload = () => {
      const [canvas, factor] = [canvasRef.current, (image.height * image.width) / 32]
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0)

      // draw points randomly
      const n = factor * pointDensity / 20
      for (let i = 0; i < n; i++) {
        const [x, y] = [random(0, canvas.width), random(0, canvas.height)]
        ctx.lineWidth = pointSize
        ctx.fillStyle = fillColor
        ctx.strokeStyle = fillColor
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 1, y + 1)
        ctx.closePath()
        ctx.stroke()
      }
      // draw lines randomly
      for (let i = 0; i < factor / 150; i++) {
        const [x, y] = [random(0, canvas.width), random(0, canvas.height)]
        ctx.lineWidth = lineThickness
        ctx.fillStyle = fillColor
        ctx.strokeStyle = fillColor
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + random(-random(0, canvas.width / 2), random(0, canvas.width / 2)), y + random(-random(0, canvas.width / 2), random(0, canvas.width / 2)))
        ctx.closePath()
        ctx.stroke()
      }
      setNewImg(canvas.toDataURL('image/png'))
    }
    image.src = oldImg
  }

  function textToImage () {
    if (userText === null) return

    const [canvas, finalLineLength] = [canvasRef.current, Math.min(lineLength, userText.length)]
    canvas.width = fontSize * finalLineLength + 20
    canvas.height = fontSize * (3 / 2) * (Math.ceil(userText.length / finalLineLength)) + userText.split('\n').length * fontSize
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'
    ctx.strokeStyle = 'black'
    ctx.font = fontWeight + ' ' + fontSize + 'px sans-serif'
    ctx.textBaseline = 'top'
    canvas.style.display = 'none'

    let [curPos, paraArray] = [0, userText.split('\n')]
    for (let paraIndex = 0; paraIndex < paraArray.length; paraIndex++) {
      ((textToDraw) => {
        while (textToDraw.length > finalLineLength) {
          const [thisLineText, r] = [textToDraw.substring(0, finalLineLength), random(-1, 1) / random(50, 100)]
          textToDraw = textToDraw.substring(finalLineLength)
          ctx.rotate(r)
          ctx.fillText(thisLineText, 10, 5 + fontSize * (3 / 2) * curPos++, canvas.width)
          ctx.rotate(r * -1)
        }
        ctx.fillText(textToDraw, 0, fontSize * (3 / 2) * curPos, canvas.width)
      })(paraArray[paraIndex])
      ctx.fillText('\n', 0, fontSize * (3 / 2) * curPos++, canvas.width)
    }
    setOldImg(canvas.toDataURL('image/png'))
  }

  React.useEffect(() => {
    const handlePasteAnywhere = event => {
      const clipboardItems = event.clipboardData.items
      const items = [].slice.call(clipboardItems).filter((item) => item.type.indexOf('image') !== -1)
      if (items.length === 0) return
      setOldImg(URL.createObjectURL(items[0].getAsFile()))
    }
    window.addEventListener('paste', handlePasteAnywhere)
    blurImage()
    return () => window.removeEventListener('paste', handlePasteAnywhere)
  }, [oldImg, lineThickness, pointSize, pointDensity, fillColor])

  React.useEffect(() => {
    textToImage()
  }, [userText, fontSize, fontWeight, lineLength])

  React.useEffect(() => {
    const saveArgsToLocal = () => {
      if (lineThickness) localforage.setItem('lineThickness', lineThickness)
      if (pointSize) localforage.setItem('pointSize', pointSize)
      if (pointDensity) localforage.setItem('pointDensity', pointDensity)
      if (fillColor) localforage.setItem('fillColor', fillColor)
      if (fontSize) localforage.setItem('fontSize', fontSize)
      if (fontWeight) localforage.setItem('fontWeight', fontWeight)
      if (lineLength) localforage.setItem('lineLength', lineLength)
    }
    saveArgsToLocal()
  }, [lineThickness, pointSize, pointDensity, fillColor, fontSize, fontWeight, lineLength])

  React.useEffect(() => {
    const loadArgsFromLocal = async () => {
      const setFns = [setLineThickness, setPointSize, setPointDensity, setFillColor, setFontSize, setFontWeight, setLineLength]
      const localVals = [(await localforage.getItem('lineThickness')),
        (await localforage.getItem('pointSize')),
        (await localforage.getItem('pointDensity')),
        (await localforage.getItem('fillColor')),
        (await localforage.getItem('fontSize')),
        (await localforage.getItem('fontWeight')),
        (await localforage.getItem('lineLength'))]
      localVals.some(e => e === null) ? resetArgs() : localVals.map((v, i) => setFns[i](v))
    }
    loadArgsFromLocal().then(console.log).catch(console.error)
  }, [])

  return (
    <div>
      <antd.Space
        direction="vertical"
        style={{ width: '100%' }}
        size={[0, 48]}
      >
        <antd.Layout>
          <antd.Layout.Header
            style={{
              textAlign: 'center',
              color: '#fff',
              marginBottom: '16px',
            }}
          ><h1>Anti OCR</h1></antd.Layout.Header>
          <antd.Layout.Content>
            <antd.Row
              gutter={16}
              style={{ justifyContent: 'center', }}
            >
              <antd.Col span={15}>
                <antd.Input.TextArea
                  value={userText}
                  style={{ minHeight: '100%', }}
                  placeHolder="输入或粘贴(Ctrl + V)任意文字或图片"
                  onChange={e => setUserText(e.target.value)}/>
                {userText ? <antd.Button
                  type="primary"
                  style={{
                    zIndex: 2,
                    bottom: '8px',
                    right: '8px',
                    position: 'absolute',
                  }}
                  onClick={() => setUserText('')}
                >Clear
                </antd.Button> : null}

              </antd.Col>
              <antd.Col span={4}>
                <antd.Tooltip title="在任意位置按Ctrl+V, 或者拖放图片到此处">
                  <antd.Card>
                    <antd.Upload.Dragger
                      style={{ maxHeight: '100%', }}
                      onChange={(info) => {
                        const { status } = info.file
                        if (status !== 'uploading') {
                          const reader = new FileReader()
                          reader.onload = e => setOldImg(e.target.result)
                          reader.readAsDataURL(info.file.originFileObj)
                        }
                        if (status === 'done') {
                          antd.message.success(`${info.file.name} file uploaded successfully.`)
                        } else if (status === 'error') {
                          antd.message.error(`${info.file.name} file upload failed.`)
                        }
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <icons.InboxOutlined/>
                      </p>
                    </antd.Upload.Dragger>
                  </antd.Card>
                </antd.Tooltip>
              </antd.Col>
            </antd.Row>
            <antd.Divider/>

            <antd.Row gutter={16}>
              <antd.Col span={3}>
                <antd.Card
                  title="参数调节"
                  extra={<antd.Tooltip title="重置所有参数为默认值" style={{ float: 'right' }}>
                    <antd.Button icon={<icons.RollbackOutlined/>} type="dashed" onClick={resetArgs}/>
                  </antd.Tooltip>}
                  style={{
                    minHeight: 600,
                    maxHeight: 600,
                  }}>
                  <antd.Form
                    key={[lineThickness, pointSize, pointDensity, fillColor, fontSize, fontWeight, lineLength]}
                    layout=""
                    size="small"
                  >
                    <antd.Form.Item label="线条粗细" name="lineThickness">
                      <antd.InputNumber defaultValue={lineThickness}
                                        onWheel={e => setLineThickness(lineThickness + (e.deltaY < 0 ? 1 : -1))}
                                        onChange={(n) => setLineThickness(n)}/>
                    </antd.Form.Item>
                    <antd.Form.Item label="画点大小" name="pointSize">
                      <antd.InputNumber defaultValue={pointSize}
                                        onWheel={e => setPointSize(pointSize + (e.deltaY < 0 ? 1 : -1))}
                                        onChange={(n) => setPointSize(n)}/>
                    </antd.Form.Item>
                    <antd.Form.Item label="画点密度" name="pointDensity">
                      <antd.InputNumber defaultValue={pointDensity}
                                        onWheel={e => setPointDensity(pointDensity + (e.deltaY < 0 ? 1 : -1))}
                                        onChange={(n) => setPointDensity(n)}/>
                    </antd.Form.Item>
                    <antd.Form.Item label="填充颜色" name="fillColor">
                      <antd.Select defaultValue={fillColor}
                                   onChange={(n) => setFillColor(n)}>
                        {['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 'lime', 'maroon', 'navy', 'olive', 'purple', 'red', 'silver', 'teal', 'white', 'yellow']
                          .map(c => <Option key={c} value={c}>{c}</Option>)}
                      </antd.Select>
                    </antd.Form.Item>
                    <antd.Divider/>
                    <antd.Form.Item label="字号(px)" name="fontSize">
                      <antd.InputNumber defaultValue={fontSize}
                                        onWheel={e => setFontSize(fontSize + (e.deltaY < 0 ? 1 : -1))}
                                        onChange={(n) => setFontSize(n)}/>
                    </antd.Form.Item>
                    <antd.Form.Item label="字重" name="fontWeight">
                      <antd.Select defaultValue={fontWeight}
                                   onChange={(n) => setFontWeight(n)}>
                        <Option value="normal">正常</Option>
                        <Option value="bold">粗体</Option>
                      </antd.Select>
                    </antd.Form.Item>
                    <antd.Form.Item label="每行字数" name="lineLength">
                      <antd.InputNumber defaultValue={lineLength}
                                        onWheel={e => setLineLength(lineLength + (e.deltaY < 0 ? 1 : -1))}
                                        onChange={(n) => setLineLength(n)}/>
                    </antd.Form.Item>
                  </antd.Form>
                </antd.Card>
              </antd.Col>

              <antd.Col span={11}>
                <antd.Card
                  title="结果图片"
                  style={{
                    minHeight: 600,
                    maxHeight: 600,
                  }}>
                  <antd.Image
                    src={newImg}
                    preview={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: 500,
                    }}
                  />
                </antd.Card>
              </antd.Col>
              <antd.Col span={6}>
                <Emoji64Recode userText={userText}/>
              </antd.Col>
              <antd.Col span={4}>
                <antd.Card
                  title="原图"
                  style={{
                    minHeight: 300,
                    maxHeight: 300
                  }}>
                  <antd.Image
                    src={oldImg}
                    preview={false}
                    style={{
                      width: '100%',
                      height: 200
                    }}
                  />
                </antd.Card>
                <antd.Card
                  title={'参考OCR效果' + (ocrNewImg ? '(结果图)' : '(原图)')}
                  extra={<antd.Tooltip title="OCR结果图片，若关闭则OCR原图" style={{ float: 'right' }}>
                    <antd.Switch defaultChecked onChange={setOcrNewImg}/>
                  </antd.Tooltip>}
                  style={{
                    minHeight: 300,
                    maxHeight: 300,
                  }}>
                  <OcrBoard image={ocrNewImg ? newImg : oldImg}/>
                </antd.Card>
              </antd.Col>
            </antd.Row>
            <antd.Divider/>

          </antd.Layout.Content>
        </antd.Layout>
      </antd.Space>
      <canvas id="canvas" style={{
        display: 'block',
        width: '0',
        height: '0'
      }} ref={canvasRef}></canvas>
    </div>
  )
}

function OcrBoard (props) {
  const ocrPlaceholder = '正在识别...'
  const [ocrProgress, setOcrProgress] = React.useState(0)
  const [ocrResult, setOcrResult] = React.useState(ocrPlaceholder)

  React.useEffect(() => {
    if (!props.image) return
    (async () => {
      const worker = await Tesseract.createWorker({
        logger: m => setOcrProgress(m),
        langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_best'
      })
      Tesseract.setLogging(true)
      await worker.loadLanguage('chi_sim')
      await worker.initialize('chi_sim')
      const result = await worker.recognize(props.image)
      setOcrResult(result.data.text)
      await worker.terminate()
    })()
  }, [props.image])

  return (
    <div>
      <antd.Input.TextArea
        readOnly
        showCount
        key={ocrResult}
        defaultValue={ocrResult}
        style={{
          height: 120,
          marginBottom: 24
        }}/>
      <antd.Divider/>
      <antd.Row>
        <antd.Col span={8} style={{ color: 'grey' }}>{ocrProgress.status + ': '}</antd.Col>
        <antd.Col span={16}>
          <antd.Progress percent={Math.round(ocrProgress.progress * 100)}/>
        </antd.Col>
      </antd.Row>
    </div>
  )
}

function Emoji64Recode (props) {
  const [resultText, setResultText] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    let r = '解码中...'
    try {
      r = emoji64Auto(props.userText)
    } catch (error) {
      console.error(error)
    }
    setResultText(r)
    setCopied(false)
  }, [props.userText])

  return (
    <React.Fragment>
      <antd.Card
        title="emoji64编解码"
        style={{
          minHeight: 600,
          maxHeight: 600
        }}>
        <antd.Input.TextArea
          readOnly
          value={resultText}
          placeHolder="Emoji translation will appear here..."
          style={{
            height: 480,
            marginBottom: 24
          }}
        />
        {props.userText ? <antd.Button
          type="primary"
          style={{
            zIndex: 2,
            bottom: '16px',
            right: '16px',
            position: 'absolute',
          }}
          onClick={async () => {
            await navigator.clipboard.writeText(resultText)
            setCopied(true)
          }}
        >{copied ? 'Copied' : 'Copy'}
        </antd.Button> : null}
      </antd.Card>

    </React.Fragment>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>)
