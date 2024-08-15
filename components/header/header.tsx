// ! Layout Components
import type { NextPage } from 'next';
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import estilos from "./header.module.css";

function Header(props: any): JSX.Element {

    const [usuarioLogadoState, setUsuarioLogadoState] = useState<string|null>('');

    return (
        <>
            <div className={estilos.imagemFundo} >
                <div className={estilos.superContainer}  >
                    {props.titulo}
                </div>
                <div className={estilos.container} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: '60px', paddingRight: '50px', gap: '50px' }} >
                </div>
            </div>

        </>
    )

}

export default Header;