import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import BackupIcon from '@mui/icons-material/Backup';
import ReactLoading from "react-loading";
import { exportImages } from '../services/ExportImages';
import { PegarAlturaDoNavegador, PegarLarguraDoNavegador } from '../utils/PegarDimenssoes';
import { api } from '../services/api';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2'
import icon from '../assets/images/icon_ts_reactjs.png';

type targetProps = {
    target: HTMLInputElement
}

type ServerError = { errorMessage: string };

interface InfoJsonOcr {
    born?: string;
    cnhNumber?: string;
    cpf?: string;
    documentID?: string;
    name?: string;
    validity?: string;
}

const Home: NextPage = () => {
    const divImagenDocExtractRef = useRef<any>();
    //IMPLEMENTAÇÃO DAS FUNCIONALIDADES ABAIXO //
    /*******************************************/
    const [selectedFile, setSelectedFile] = useState<File | undefined>();
    const [selectedFileOcr, setSelectedFileOcr] = useState<File | undefined>();
    const [tempImage, setTempImage] = useState('');
    const [tempImageOcr, setTempImageOcr] = useState('');
    const [infoJson, setInfoJson] = useState<any>('');
    const [infoJsonOcr, setInfoJsonOcr] = useState<InfoJsonOcr>({});
    const [showButton, setShowButton] = useState(false);
    const [showButtonOcr, setShowButtonOcr] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOcr, setIsLoadingOcr] = useState(false);
    const [documentType, setDocumentType] = useState('');
    const images = exportImages();
    const [flagShowHide, setFlagShowHide] = useState(false);
    const [flagMostrarDadosHideShow, setFlagMostrarDadosHideShow] = useState(false);


    //Objeto para tradução das propriedades da API
    const translatedInfo = {
        probabilidade: '',
        documento: '',
    }
    const erro = {
        erro: 'A imagem não é um documento válido ou ainda não existe'
    }

    //Função que transforma o File em uma imagem base64
    function getBase64(file: File) {
        return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    //Arquivo da imagem em tipo File vindo de um estado
    const image = selectedFile;
    const imageOcr = selectedFileOcr;

    async function parseImage() {
        //Verificação para saber se o File é Undefined
        if (!image) {
            return
        }
        // executa a função que transforma a imagem em Base64
        const apiImage = await getBase64(image)
        const newApiImage = await apiImage.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", "")

        return { newApiImage, apiImage };
    }

    async function parseImageOcr() {
        //Verificação para saber se o File é Undefined
        if (!imageOcr) {
            return
        }

        const apiImageOcr = await getBase64(imageOcr);
        const newApiImageOcr = await apiImageOcr.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", "")

        return { apiImageOcr, newApiImageOcr }
    }
    //função de post da imagem normal
    async function postImage(data: any) {
        alert(JSON.stringify(data));
        let response = '';
        const config = {
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.REACT_APP_SUBSCRIPTION_KEY || ''
            }
        }
        try {
            //POST com axios
            const res = await api.post('https://' + process.env.REACT_APP_ENDERECO_COGNITIVE, data, config)
            response = res.data;
        } catch (error) {
            setInfoJson(false);
            setIsLoading(false);
            setShowButton(!showButton);
            setTempImage('');
            if (axios.isAxiosError(error)) {
                const serverError = error as AxiosError<ServerError>;
                if (serverError && serverError.response) {
                    console.log(serverError.response.data);
                    return
                }
            }
            console.log({ errorMessage: "Erro base" });
            return
        }
        return response;
    }

    //RECEBE E RETORNA OS DADOS DA CNH
    async function postImageOcr(data: any) {
        let dadosRecebidos = data;
        let dadosRecebidos2 = dadosRecebidos;

        let response: any = ''; const config = {
            headers: {
                "Ocp-Apim-Subscription-Key": process.env.REACT_APP_SUBSCRIPTION_KEY || ''
            }
        }
        try {
            //POST com axios
            const res = await api.post(process.env.REACT_APP_ENDERECO_COGNITIVE + '/', data, config)
            response = res.data;
            if (response) {
                return response;
            }
            // alert(JSON.stringify(response,null,5));
        } catch (error) {
            console.log(error);
            // setInfoJsonOcr(erro.erro);
            setIsLoadingOcr(false);
            setShowButtonOcr(!showButtonOcr);
            if (axios.isAxiosError(error)) {
                const serverError = error as AxiosError<ServerError>;
                if (serverError && serverError.response) {
                    console.log(serverError.response.data);
                    let erro = serverError.response.data;
                    Swal.fire("Ocorreu um error!", JSON.stringify(serverError.response.data) + '', 'error');
                }
            }
        }
    }

    //Função de envio da imagem para API
    async function handleSendImage() {
        setIsLoading(true);
        const parsedImage = await parseImage();
        //Criando um JSON Data para enviar a imagem pelo Axios
        const data = JSON.stringify({
            "file_name": image?.name,
            "image": parsedImage?.newApiImage
        });
        console.log(data);
        const response: any = await postImage(data);
        console.log(response)

        // Desestruturação do Objeto para usar somente duas propriedades com uma função que chama ela mesma 
        const pickedProps = (({ hit, type }) => {
            return { hit, type }
        })(response);
        console.log(pickedProps);

        //Tradução das propriedades da API
        translatedInfo.probabilidade = `${pickedProps.hit.toFixed(0)}%`;
        translatedInfo.documento = pickedProps.type.split("-", 1).toString();
        setInfoJson(translatedInfo);
        //Estado que controla o botão de enviar ou adicionar imagem
        setIsLoading(false);
        setShowButton(!showButton);
        //Estado que armazena a foto enviada em Base64 para possível uso pelo front
        setTempImage(parsedImage?.apiImage);
    }

    //Função de envio da imagem Ocr
    async function handleSendImageOcr() {
        if (!documentType) {
            alert("Você precisar marcar um tipo de documento");
            return
        }
        setIsLoadingOcr(true);

        const parsedImage = await parseImageOcr();
        //Criando um JSON Data para enviar a imagem pelo Axios
        const data = JSON.stringify({
            "file_name": imageOcr?.name,
            "image_type": documentType,
            "image": parsedImage?.newApiImageOcr
        });
        console.log(data);

        const response: any = await postImageOcr(data);
        console.log(response)


        //Só realiza a execução se contiver informação Abaixo
        if (response) {
            setInfoJsonOcr(response.data);
            //Estado que controla o botão de enviar ou adicionar imagem
            setIsLoadingOcr(false);
            setShowButtonOcr(!showButtonOcr);
            //Estado que armazena a foto enviada em Base64 para possível uso pelo front
            setTempImageOcr(parsedImage?.apiImageOcr);
            setFlagShowHide(true);
            setFlagMostrarDadosHideShow(true);

        }//if

    }

    /*******************************************/
    //IMPLEMENTAÇÃO DAS FUNCIONALIDADES ACIMA //
    const [urlFoto, setUrlFoto] = useState('');
    async function onFileSelectedFoto(event: any): Promise<void> {
        // event.preventDefault();
        let url = URL.createObjectURL(event.target.files[0]);
        // alert(JSON.stringify(url));
        setUrlFoto(url.toString());
    }

    function novaExtracaoDocumento() {
        setFlagShowHide(false);
        setFlagMostrarDadosHideShow(false);
    }

    let inputRef: any;

    return (
        <div className={styles.container}>
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
                <div style={{ height: '15px', background: 'transparent' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '10px', width: '100%', height: '50px', background: 'transparent' }}>
                    {/* <img src={''} style={{ height: '50px', width: '200px', background: 'transparent' }} /> */}
                    <div style={{ display: 'flex', flexDirection: 'row', height: '50px', width: '100%', paddingLeft: '200px', background: 'transparent' }}>
                        <hr style={{ height: '3px', width: '90%', background: 'white' }} ></hr>
                    </div>
                </div>
            </Head>

            <main className={styles.main}>

                <label style={{ fontSize: '55px' }} >Extração de Documentos</label>

                {/* <div style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center', height: '540px', background: 'linear-gradient(#8F50F5, #630A66, #B249FB)' }}> */}
                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center', height: '540px', background: 'transparent' }}>

                    <div className={styles.cards}>
                        <div className={styles.card} >
                            <div ref={divImagenDocExtractRef} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '20px', width: '100%', height: '100%', background: '#cd11f5', border: ' 1px white', borderRadius: '10px' }}>
                                {
                                    isLoadingOcr ?
                                        <label htmlFor="files" className="mainContent-uploadImage_content">
                                            <ReactLoading type={'spin'} color="#FF8B63" />
                                        </label>
                                        :
                                        flagShowHide ?
                                            <img style={{ width: divImagenDocExtractRef.current.offsetWidth, height: '100%', objectFit: 'cover' }} src={urlFoto} alt="fotoDocumento" />
                                            :
                                            <label style={{ fontSize: '25px' }}>FOTO DO DOCUMENTO</label>
                                }
                            </div>
                        </div>



                        <div className={styles.card} >
                            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '10%', background: 'rgb(143 143 236)' }}>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '12px', width: '100%', color: 'white', }} >
                                    <label style={{ display: 'flex', alignItems: 'center' }} >Escolha o tipo de documento antes de enviar uma imagem:</label>
                                </div>
                                <RadioGroup style={{ display: 'grid', gridTemplateColumns: '50% 50%', width: '100%', height: '100%', margin: '0px', paddingLeft: '0', background: 'transparent' }}
                                    row
                                    aria-labelledby="demo-form-control-label-placement"
                                    name="position"
                                    onChange={(event) => { setDocumentType(event.target.value); }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', height: 'auto', border: 'solid 1px #E6E6E6', background: 'transparent', paddingLeft: '5%', paddingTop: '5px' }} >
                                        <FormControlLabel style={{ width: '100%' }}
                                            value="RG-"
                                            control={<Radio />}
                                            label="RG"
                                            labelPlacement="end"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', height: 'auto', border: 'solid 1px #E6E6E6', background: 'transparent', paddingLeft: '5%', paddingTop: '5px' }} >
                                        <FormControlLabel
                                            value="CNH"
                                            control={<Radio />}
                                            label="CNH"
                                            labelPlacement="end"
                                        />
                                    </div>
                                </RadioGroup>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'row', padding: '10px', width: '100%', height: '90%', background: 'rgb(143 143 236)' }}  >
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', background: 'white' }} className="mainContent-uploadImage_content contentWM" >
                                    {/* O Ternário mostra na tela Adicionar arquivos OU enviar OU o loading dependendo da condição */}
                                    {
                                        flagMostrarDadosHideShow === true ?
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 'auto', width: '100%', color: 'blue', gap: '10px', background: 'transparent' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: 'auto', width: '100%', color: 'blue', gap: '10px', paddingLeft: '25%', background: 'transparent' }}>
                                                    <label>DADOS VÃO SER MOSTRADO AQUI !</label>
                                                    <div>
                                                        <label>Data de Nascimento :</label>
                                                        <label>{infoJsonOcr?.born}</label>
                                                    </div>
                                                    <div>
                                                        <label>Nº Cnh:</label>
                                                        <label>{infoJsonOcr?.cnhNumber}</label>
                                                    </div>
                                                    <div>
                                                        <label>Nº Cpf:</label>
                                                        <label>{infoJsonOcr?.cpf}</label>
                                                    </div>
                                                    <div>
                                                        <label>Nº RG: </label>
                                                        <label>{infoJsonOcr?.documentID}</label>
                                                    </div>
                                                    <div>
                                                        <label>Nome: </label>
                                                        <label>{infoJsonOcr?.name}</label>
                                                    </div>
                                                    <div>
                                                        <label>Validade: </label>
                                                        <label>{infoJsonOcr?.validity}</label>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                                                    <button id='NovaExtracao' onClick={novaExtracaoDocumento} style={{ width: '200px', height: '50px', cursor: 'pointer', border: 'solid 0px', borderRadius: '25px', color: 'white', background: 'linear-gradient(#5657CD, #8654C7, #BC51C1)' }} >Nova Extração</button>
                                                </div>
                                            </div>
                                            :
                                            showButtonOcr === false ?
                                                <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                    <BackupIcon style={{ width: '100px', height: '100px', background: '#c1b3f3' }} />
                                                    <h3 style={{ color: '#9c64d1', fontSize: '20px' }} >Clique ou arraste os arquivos aqui</h3>
                                                    <input style={{ display: 'none' }} id='filesOcr' accept=".png, .jpg, .jpeg" type='file' onChange={(event: targetProps) => {
                                                        if (event.target.files) {
                                                            console.log('Peguei a imagem 2')
                                                            setSelectedFileOcr(event.target.files[0]);
                                                            setShowButtonOcr(!showButtonOcr);
                                                            setUrlFoto(URL.createObjectURL(event.target.files[0]));
                                                        }
                                                    }} />
                                                </label>
                                                :
                                                isLoadingOcr ?
                                                    <label htmlFor="files" className="mainContent-uploadImage_content">
                                                        <ReactLoading type={'spin'} color="#FF8B63" />
                                                    </label>
                                                    :
                                                    <label htmlFor="files" className="mainContent-uploadImage_content">
                                                        <button id='files' onClick={handleSendImageOcr} style={{ width: '200px', height: '50px', border: 'solid 0px', borderRadius: '25px', color: 'white', background: 'linear-gradient(#5657CD, #8654C7, #BC51C1)' }} >Enviar Imagem</button>
                                                    </label>
                                    }

                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>


            <footer className={styles.footer}>
                <a
                    href="https://www.linkedin.com/in/ederson-feliciano-corsatto/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Developed by{' Edersonfc7'}
                    <span className={styles.logo}>
                        <Image src={icon} alt="Vercel Logo" />
                    </span>
                </a>
            </footer>


        </div>
    )
}

export default Home
